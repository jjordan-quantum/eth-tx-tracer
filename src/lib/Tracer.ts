import {Erc20CallEncoder} from "../services/encoders/Erc20CallEncoder";
import Contract from "web3-eth-contract";
const Web3Utils = require('web3-utils');
import TraceCallLogsFetcher, {LogTracerResult} from "../services/fetchers/TraceCallLogsFetcher";
import TraceCallStateDiffFetcher, {StateDiffTracerResult} from "../services/fetchers/TraceCallStateDiffFetcher";
import EthCallFetcher, {EthCallFetcherResult} from "../services/fetchers/EthCallFetcher";
import {UniswapV2SwapEncoder} from "../services/encoders/UniswapV2SwapEncoder";
import {UniswapV2ERC20ABI} from "../abis/UnipswapV2ERC20ABI";
import {MAINNET_DAI_ADDRESS, MAINNET_USDC_ADDRESS, ZERO_ADDRESS} from "./constants";
import {Erc20CallDecoder} from "../services/decoders/Erc20CallDecoder";
import {CallOptions, ContractCallResult, TracerOptions, TraceTxOptions, TraceType} from "./types";

export class Tracer {
  jsonRpcUrl: string;
  logTracer: TraceCallLogsFetcher;
  stateTracer: TraceCallStateDiffFetcher;
  erc20CallEncoder: Erc20CallEncoder;
  erc20CallDecoder: Erc20CallDecoder;
  swapCallEncoder: UniswapV2SwapEncoder;
  cachedState: any = {};

  constructor(options: TracerOptions) {
    const {
      jsonRpcUrl,
    } = options;

    const erc20Contract = new Contract(UniswapV2ERC20ABI as any[], MAINNET_USDC_ADDRESS)
    this.jsonRpcUrl = jsonRpcUrl;
    this.logTracer = new TraceCallLogsFetcher();
    this.stateTracer = new TraceCallStateDiffFetcher();
    this.erc20CallEncoder = new Erc20CallEncoder(erc20Contract);
    this.erc20CallDecoder = new Erc20CallDecoder(erc20Contract);
    this.swapCallEncoder = new UniswapV2SwapEncoder();
  }

  clearState() {
    this.cachedState = {};
  }

  setState(state: any) {
    this.cachedState = JSON.parse(JSON.stringify(state));
  }

  setStateValue(key: string, value: any) {
    this.cachedState[key] = value;
  }

  async traceCall(tx: any, traceTxOptions: TraceTxOptions): Promise<StateDiffTracerResult | LogTracerResult> {
    const {
      traceType,
      blockNumber,
      blockOverrides,
      stateOverrides,
      cacheStateFromTrace,
      useCachedState,
      targetAddress,
      balanceOverride,
    } = traceTxOptions;

    if(traceType === TraceType.logs) {
      return this.logTracer.apply(
        this.jsonRpcUrl,
        {...tx},
        blockNumber,
        {
          ...(useCachedState ? this.cachedState : {}),
          ...(stateOverrides || {}),
          ...(balanceOverride ? ({[tx.from]: { balance: Web3Utils.numberToHex(balanceOverride) }}) : {}),
        },
        blockOverrides,
      );
    }

    if(traceType !== TraceType.state) {
      return {
        success: false,
        message: `unknown TraceType: ${traceType}`,
      }
    }

    const result: StateDiffTracerResult = await this.stateTracer.apply(
      this.jsonRpcUrl,
      {...tx},
      targetAddress,
      blockNumber,
      {
        ...(useCachedState ? this.cachedState : {}),
        ...(stateOverrides || {}),
        ...(balanceOverride ? ({[tx.from]: { balance: Web3Utils.numberToHex(balanceOverride) }}) : {}),
      },
      blockOverrides,
    );

    if(!cacheStateFromTrace) {
      return {...result};
    }

    const {
      success,
      resultingOverrides,
    } = result;

    if(!success || !resultingOverrides) {
      return {...result};
    }

    const useOverrides = JSON.parse(JSON.stringify(resultingOverrides));
    const addresses = Object.keys(useOverrides);

    for(const address of addresses) {
      if(!this.cachedState.hasOwnProperty(address)) {
        this.cachedState[address] = {...useOverrides[address]};
        continue;
      }

      const keys =  Object.keys(useOverrides[address]);

      for(const key of keys) {
        if(key === 'stateDiff') {
          const slots = Object.keys(useOverrides[address].stateDiff);

          for(const slot of slots) {
            this.cachedState[address].stateDiff[slot] = useOverrides[address].stateDiff[slot];
          }
        } else {
          this.cachedState[address][key] = useOverrides[address][key];
        }
      }
    }

    return {...result};
  }

  async ethCall(tx: any, callOptions: CallOptions): Promise<EthCallFetcherResult> {
    const {
      blockNumber,
      stateOverrides,
      useCachedState,
      usePendingBlock,
      balanceOverride,
    } = callOptions;

    return EthCallFetcher.apply(
      this.jsonRpcUrl,
      {...tx},
      blockNumber,
      {
        ...(useCachedState ? this.cachedState : {}),
        ...(stateOverrides || {}),
        ...(balanceOverride ? ({[tx.from]: { balance: Web3Utils.numberToHex(balanceOverride) }}) : {}),
      },
      usePendingBlock,
    );
  }

  // ==================================================
  //
  // token contract calls using overrides
  //
  // ==================================================

  async getTokenBalance(token: string, owner: string, useCachedState: boolean = true): Promise<ContractCallResult<string>> {
    try {
      const balanceOfData: string = this.erc20CallEncoder.encodeBalanceOf(
        token,
        owner,
      );

      const balanceOfCallTx: any = {
        from: ZERO_ADDRESS,  // sender address doesn't matter for this particular contract call
        to: token,
        data: balanceOfData,
      }

      const result: EthCallFetcherResult = await this.ethCall({...balanceOfCallTx}, {
        useCachedState,
      });

      if(!result.success) {
        return {
          success: false,
          message: `eth_call failed - message: ${result.message}`,
          error: result.error,
        }
      }

      if(!result.result) {
        return {
          success: false,
          message: `result undefined for eth_call - message: ${result.message}`,
          error: result.error,
        }
      }

      const balance: string | undefined = this.erc20CallDecoder.decodeBalanceOf(result.result as string);

      return {
        success: !!balance,
        message: !!balance ? undefined : `failed to decode eth_call result of: ${result.result}`,
        result: balance,
      }
    } catch(e) {
      return {
        success: false,
        message: `encountered error getting token balance`,
        error: e,
      }
    }
  }

  async getTokenAllowance(token: string, owner: string): Promise<any> {}
  async getTokenTotalSupply(token: string, owner: string): Promise<any> {}
  async getTokenName(token: string, owner: string): Promise<any> {}
  async getTokenSymbol(token: string, owner: string): Promise<any> {}
  async getTokenDecimals(token: string, owner: string): Promise<any> {}
}
