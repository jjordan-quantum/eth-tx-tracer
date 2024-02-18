import {Tracer} from "../src";
import * as util from "util";
import {
  MAINNET_DAI_ADDRESS,
  MAINNET_UNISWAPV2_ROUTER,
  MAINNET_WETH_ADDRESS,
  MAX_UINT_256
} from "../src";
import {JSON_RPC_URL, MY_DEV_ADDRESS, ONE_HUNDRED_ETH, TEN_ETH} from "./constants";
import {TraceType} from "../src";

const tracer = new Tracer({jsonRpcUrl: JSON_RPC_URL});

(async () => {
  // =========================================================================
  //
  // swapping a large amount of ETH to DAI - prepare
  //
  // =========================================================================

  // encode a swap on UniswapV2 from 10 ETH -> DAI
  const swapData = tracer.swapCallEncoder.encodeSwapExactEthForTokens(
    '1000',  // not worried about slippage - only tracing
    [MAINNET_WETH_ADDRESS, MAINNET_DAI_ADDRESS],
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

  // =========================================================================
  //
  // trace the swap and print the logs emitted
  //
  // =========================================================================

  // trace swap tx and cache state
  const result0 = await tracer.traceCall({...swapTx}, {
    traceType: TraceType.logs,
    balanceOverride: ONE_HUNDRED_ETH,
  });

  console.log('\nLogs traced for swap from ETH -> DAI:');
  console.log('===========================================================\n');

  console.log(util.inspect(result0.logs || [], false, null, true));
})();
