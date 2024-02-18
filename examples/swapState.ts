import {Tracer} from "../src";
import * as util from "util";
import {config} from "dotenv";
import {MAINNET_UNISWAPV2_ROUTER, MAINNET_USDC_ADDRESS, MAINNET_WETH_ADDRESS, MAX_UINT_256} from "../src/lib/constants";
import {TraceType} from "../src/lib/Tracer";

const Web3Utils = require('web3-utils');

const MY_DEV_ADDRESS: string = '0x6b8fA3E8E2FDABC3d9Cd5985Ee294aa44B82B351';
const TEN_ETH = Web3Utils.toWei('10', 'ether');
const ONE_HUNDRED_ETH = Web3Utils.toWei('100', 'ether');

config();

// you only need this if you are not using ssl for your nodes - shhhhhh
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = String(0);

const jsonRpcUrl = process.env.JSON_RPC_URL as string;
const tracer = new Tracer({jsonRpcUrl});

(async () => {
  // =========================================================================
  //
  // swapping a large amount of ETH to USDC
  //
  // =========================================================================

  // encode a swap on UniswapV2 from 10 ETH -> USDC
  const swapData = tracer.swapCallEncoder.encodeSwapExactEthForTokens(
    '0',  // not worried about slippage - only tracing
    [MAINNET_WETH_ADDRESS, MAINNET_USDC_ADDRESS],
    MY_DEV_ADDRESS,
    MAX_UINT_256,  // never expires
  );

  // prepare swap tx
  const swapTx = {
    from: MY_DEV_ADDRESS,
    to: MAINNET_UNISWAPV2_ROUTER,
    value: TEN_ETH,
    data: swapData,
  }

  // trace swap tx and cache state
  const result0 = await tracer.traceCall({...swapTx}, {
    traceType: TraceType.state,
    balanceOverride: ONE_HUNDRED_ETH,
    useCachedState: false,
    cacheStateFromTrace: true,
  });

  console.log('\nEthCallFetcher result for swap from ETH -> USDC:');
  console.log('===========================================================\n');
  console.log(util.inspect(result0, false, null, true));

  // TODO - check balance of USDC after using state
})();
