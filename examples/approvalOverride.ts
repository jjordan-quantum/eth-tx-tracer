import {Tracer} from "../src";
import * as util from "util";
import {MAINNET_USDC_ADDRESS} from "../src/lib/constants";
import {TraceType} from "../src/lib/Tracer";
import {JSON_RPC_URL, MY_DEV_ADDRESS, TEN_ETH, TEN_USDC, TX_SENDER} from "./constants";

const tracer = new Tracer({jsonRpcUrl: JSON_RPC_URL});

(async () => {
  // =========================================================================
  //
  // try calling transferFrom from random address to send my USDC - should fail
  //
  // =========================================================================

  const transferFromData = tracer.erc20CallEncoder.encodeTransferFrom(
    MY_DEV_ADDRESS,
    TX_SENDER,
    TEN_USDC,
  );

  const transferFromTx = {
    from: TX_SENDER,
    to: MAINNET_USDC_ADDRESS,
    data: transferFromData,
  }

  const result0 = await tracer.ethCall({...transferFromTx}, {
    balanceOverride: TEN_ETH, // to be sure sender has funds
    useCachedState: false,
    usePendingBlock: false,
  });

  console.log('\nEthCallFetcher result for transferFrom without overrides:');
  console.log('===========================================================\n');
  console.log(util.inspect(result0, false, null, true));

  // =========================================================================
  //
  // tracing approval to get state overrides
  //
  // =========================================================================

  const approvalData = tracer.erc20CallEncoder.encodeApproval(
    TX_SENDER,
    TEN_USDC,
  );

  const approvalTx = {
    from: MY_DEV_ADDRESS,
    to: MAINNET_USDC_ADDRESS,
    data: approvalData,
  }

  const result1 = await tracer.traceCall({...approvalTx}, {
    traceType: TraceType.state,
    balanceOverride: TEN_ETH,
    useCachedState: false,
    cacheStateFromTrace: true,
  });

  console.log('\nEthCallFetcher result for approval tx:');
  console.log('===========================================================\n');
  console.log(util.inspect(result1, false, null, true));

  // =========================================================================
  //
  // try calling transferFrom again using approval state overrides
  //
  // =========================================================================

  const result2 = await tracer.ethCall({...transferFromTx}, {
    balanceOverride: TEN_ETH, // to be sure sender has funds
    useCachedState: true,  // this will use the state changes cached from the approval tx trace
    usePendingBlock: false,
  });

  console.log('\nEthCallFetcher result for transferFrom with overrides:');
  console.log('===========================================================\n');
  console.log(util.inspect(result2, false, null, true));
})();
