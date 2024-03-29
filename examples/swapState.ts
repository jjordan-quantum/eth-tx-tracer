import {Tracer} from "../src";
import * as util from "util";
import {
  MAINNET_DAI_ADDRESS,
  MAINNET_UNISWAPV2_ROUTER,
  MAINNET_WETH_ADDRESS,
  MAX_UINT_256,
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
  // trace the swap and cache the state changes
  //
  // =========================================================================

  // trace swap tx and cache state
  const result0 = await tracer.traceCall({...swapTx}, {
    traceType: TraceType.state,
    balanceOverride: ONE_HUNDRED_ETH,
    useCachedState: false,
    cacheStateFromTrace: true,
  });

  console.log('\nTrace result for swap from ETH -> DAI:');
  console.log('===========================================================\n');

  console.log(util.inspect({
    ...result0,
    result: 'hidden'  // <--- comment this line to see full trace result
  }, false, null, true));

  // =========================================================================
  //
  // check the balance of DAI with eth_call using state changes
  //
  // =========================================================================

  // uses cached state by default
  const balanceResult = await tracer.getTokenBalance(
    MAINNET_DAI_ADDRESS,
    MY_DEV_ADDRESS,
  );

  console.log(`\nDecoded balance: ${balanceResult.result}`);
})();
