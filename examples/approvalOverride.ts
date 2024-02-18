import {Tracer} from "../src";
import * as util from "util";
import {config} from "dotenv";
import {MAINNET_USDC_ADDRESS} from "../src/lib/constants";
import {TraceType} from "../src/lib/Tracer";

const Web3Utils = require('web3-utils');

const MY_DEV_ADDRESS: string = '0x6b8fA3E8E2FDABC3d9Cd5985Ee294aa44B82B351';
const TX_SENDER: string = '0xCAb0EdD72491cbAC069C6fDc4229e044fE894B58';
const ONE_THOUSAND_ETH = Web3Utils.toWei('1000', 'ether');
const TEN_ETH = Web3Utils.toWei('10', 'ether');
const TEN_USDC = '10000000';

config();

// you only need this if you are not using ssl for your nodes - shhhhhh
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = String(0);

const jsonRpcUrl = process.env.JSON_RPC_URL as string;
const tracer = new Tracer({jsonRpcUrl});

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

  console.log('EthCallFetcher result for transferFrom without overrides:');
  console.log(util.inspect(result0, false, null, true));

  // =========================================================================
  //
  // tracing approval to get state overrides
  //
  // =========================================================================

  const approvalData = tracer.erc20CallEncoder.encodeApproval(
    MY_DEV_ADDRESS,
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

  console.log('EthCallFetcher result for approval tx:');
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

  console.log('EthCallFetcher result for transferFrom with overrides:');
  console.log(util.inspect(result2, false, null, true));
})();
