import {Tracer} from "../src";
import * as util from "util";
import {
  MAINNET_DAI_ADDRESS,
  MAINNET_UNISWAPV2_ROUTER,
  MAINNET_WETH_ADDRESS,
  MAX_UINT_256, ZERO_ADDRESS
} from "../src/lib/constants";
import {TraceType} from "../src/lib/Tracer";
import {JSON_RPC_URL, MY_DEV_ADDRESS, ONE_HUNDRED_ETH, TEN_ETH, TEN_USDC, TX_SENDER} from "./constants";

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

  console.log('\nEthCallFetcher result for swap from ETH -> DAI:');
  console.log('===========================================================\n');
  //console.log(util.inspect(result0, false, null, true));  // <--- uncomment this to see full trace result
  console.log(util.inspect({...result0, result: 'hidden'}, false, null, true));

  console.log('\ncached state:');
  console.log('===========================================================\n');
  console.log(util.inspect(tracer.cachedState, false, null, true));

  // =========================================================================
  //
  // check the balance of DAI with eth_call using state changes
  //
  // =========================================================================

  const balanceOfData = tracer.erc20CallEncoder.encodeBalanceOf(
    MAINNET_DAI_ADDRESS,
    TX_SENDER,
  );

  const balanceOfCallTx = {
    from: ZERO_ADDRESS,  // sender address doesn't matter for this particular contract call
    to: MAINNET_DAI_ADDRESS,
    data: balanceOfData,
  }

  const result1 = await tracer.ethCall({...balanceOfCallTx}, {
    useCachedState: true,
  });

  console.log('\nEthCallFetcher result for balanceOf with overrides:');
  console.log('===========================================================\n');
  console.log(util.inspect(result1, false, null, true));
})();
