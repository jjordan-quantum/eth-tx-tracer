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

export type ContractCallResult<T> = {
  success: boolean,
  message?: string,
  error?: any,
  result?: T,
}