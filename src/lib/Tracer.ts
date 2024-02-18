import TraceCallLogsFetcher, {LogTracerResult} from "../services/fetchers/TraceCallLogsFetcher";
import TraceCallStateDiffFetcher, {StateDiffTracerResult} from "../services/fetchers/TraceCallStateDiffFetcher";
import EthCallFetcher, {EthCallFetcherResult} from "../services/fetchers/EthCallFetcher";

export type TracerOptions = {
  jsonRpcUrl: string,
}

export type TraceTxOptions = {
  traceType: TraceType,
  blockNumber?: number,  // will trace against this block - be careful if not using archive
  blockOverrides?: any,  // will be applied to blockoverrides option
  stateOverrides?: any,  // will be applied to cached state, if exists and using
  cacheStateFromTrace: boolean,  // will cache the state changes from trace, if trace type==state, after clearing cache
  useCachedState: boolean,  // uses cached state, if exists
  //clearCachedState: boolean,  // clears after trace, before caching state from trace
  targetAddress?: string,
}

export type CallOptions = {
  stateOverrides?: any,  // will be applied to cached state, if exists and using
  useCachedState: boolean,  // uses cached state, if exists
  //clearCachedState: boolean,  // clears after call
  blockNumber?: number,  // will call against this block - be careful if not using archive
  usePendingBlock: boolean,  // will call against pending block - blockNumber overrides this
}

export enum TraceType {
  logs='logs',
  state='state',
}

export class Tracer {
  jsonRpcUrl: string;
  logTracer: TraceCallLogsFetcher;
  stateTracer: TraceCallStateDiffFetcher;
  cachedState = {};

  constructor(options: TracerOptions) {
    const {
      jsonRpcUrl,
    } = options;

    this.jsonRpcUrl = jsonRpcUrl;
    this.logTracer = new TraceCallLogsFetcher();
    this.stateTracer = new TraceCallStateDiffFetcher();
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
    } = traceTxOptions;

    if(traceType === TraceType.logs) {
      return this.logTracer.apply(
        this.jsonRpcUrl,
        {...tx},
        blockNumber,
        {
          ...(useCachedState ? this.cachedState : {}),
          ...(stateOverrides || {})
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
        ...(stateOverrides || {})
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

    const addresses = Object.keys(resultingOverrides);

    for(const address of addresses) {
      if(!this.cachedState.hasOwnProperty(address)) {
        this.cachedState[address] = {...resultingOverrides[address]};
        continue;
      }

      const keys =  Object.keys(resultingOverrides[address]);

      for(const key of keys) {
        if(key === 'stateDiff') {
          const slots = Object.keys(resultingOverrides[address].stateDiff);

          for(const slot of slots) {
            this.cachedState[address].stateDiff[slot] = resultingOverrides[address].stateDiff[slot];
          }
        } else {
          this.cachedState[address][key] = resultingOverrides[address][key];
        }
      }
    }
  }

  async ethCall(tx: any, callOptions: CallOptions): Promise<EthCallFetcherResult> {
    const {
      blockNumber,
      stateOverrides,
      useCachedState,
      usePendingBlock,
    } = callOptions;

    return EthCallFetcher.apply(
      this.jsonRpcUrl,
      {...tx},
      blockNumber,
      {
        ...(useCachedState ? this.cachedState : {}),
        ...(stateOverrides || {})
      },
      usePendingBlock,
    );
  }
}
