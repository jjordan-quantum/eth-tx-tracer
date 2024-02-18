import {Tracer} from "../src";
import * as util from "util";
import {MAINNET_USDC_ADDRESS} from "../src/lib/constants";
import {JSON_RPC_URL, MY_DEV_ADDRESS, TEN_ETH, TEN_USDC, TX_SENDER} from "./constants";
import {TraceType} from "../src/lib/types";

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
  // check allowance
  //
  // =========================================================================

  // uses cached state by default
  const allowanceResult = await tracer.getTokenAllowance(
    MAINNET_USDC_ADDRESS,
    MY_DEV_ADDRESS,
    TX_SENDER,
  );

  console.log(`\nDecoded allowance: ${allowanceResult.result}`);

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

  console.log(util.inspect({
    ...result1,
    result: 'hidden'  // <--- comment this line to see full trace result
  }, false, null, true));


  // =========================================================================
  //
  // check allowance again using cached state
  //
  // =========================================================================

  // uses cached state by default
  const allowanceResult1 = await tracer.getTokenAllowance(
    MAINNET_USDC_ADDRESS,
    MY_DEV_ADDRESS,
    TX_SENDER,
  );

  console.log(`\nDecoded allowance: ${allowanceResult1.result}`);

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
