import {Erc20CallEncoder} from "../services/encoders/Erc20CallEncoder";
import Contract from "web3-eth-contract";
const Web3Utils = require('web3-utils');
import TraceCallLogsFetcher, {LogTracerResult} from "../services/fetchers/TraceCallLogsFetcher";
import TraceCallStateDiffFetcher, {StateDiffTracerResult} from "../services/fetchers/TraceCallStateDiffFetcher";
import EthCallFetcher, {EthCallFetcherResult} from "../services/fetchers/EthCallFetcher";
import {UniswapV2SwapEncoder} from "../services/encoders/UniswapV2SwapEncoder";
import {UniswapV2ERC20ABI} from "../abis/UnipswapV2ERC20ABI";
import {MAINNET_USDC_ADDRESS} from "./constants";
import {Erc20CallDecoder} from "../services/decoders/Erc20CallDecoder";

export type TracerOptions = {
  jsonRpcUrl: string,
}

export type TraceTxOptions = {
  traceType: TraceType,
  blockNumber?: number,  // will trace against this block - be careful if not using archive
  balanceOverride?: string,  // provider balance override for sender (in WEI)
  blockOverrides?: any,  // will be applied to blockoverrides option
  stateOverrides?: any,  // will be applied to cached state, if exists and using
  cacheStateFromTrace: boolean,  // will cache the state changes from trace, if trace type==state, after clearing cache
  useCachedState: boolean,  // uses cached state, if exists
  //clearCachedState: boolean,  // clears after trace, before caching state from trace
  targetAddress?: string,
}

export type CallOptions = {
  stateOverrides?: any,  // will be applied to cached state, if exists and using
  balanceOverride?: string,  // provider balance override for sender (in WEI)
  useCachedState: boolean,  // uses cached state, if exists
  //clearCachedState: boolean,  // clears after call
  blockNumber?: number,  // will call against this block - be careful if not using archive
  usePendingBlock?: boolean,  // will call against pending block - blockNumber overrides this
}

export enum TraceType {
  logs='logs',
  state='state',
}

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
}
