import {Tracer} from "../src";
import * as util from "util";

import {
  JSON_RPC_URL,
  SIMPLE_TOKEN_BYTECODE, TEN_ETH,
  TOKEN_DEPLOYER_ADDRESS
} from "./constants";
import {TraceType} from "../src/lib/types";

const tracer = new Tracer({jsonRpcUrl: JSON_RPC_URL});

(async () => {
  // =========================================================================
  //
  // deploy token contract
  //
  // =========================================================================

  const tokenDeploymentTx = {
    from: TOKEN_DEPLOYER_ADDRESS,
    data: SIMPLE_TOKEN_BYTECODE,
  }

  // trace deployment tx and cache state
  const result0 = await tracer.traceCall({...tokenDeploymentTx}, {
    traceType: TraceType.state,
    balanceOverride: TEN_ETH,
    cacheStateFromTrace: true,
  });

  console.log('\nTrace result for deployment');
  console.log('===========================================================\n');

  console.log(util.inspect({
    ...result0,
    result: 'hidden'  // <--- comment this line to see full trace result
  }, false, null, true));

  const tokenAddress: string = result0.newContracts ? result0.newContracts[0] : '';
  console.log(`\nDeployed token address: ${tokenAddress}`);

  // =========================================================================
  //
  // check deployer balance
  //
  // =========================================================================

  // uses cached state by default
  const deployerBalanceResult = await tracer.getTokenBalance(
    tokenAddress,
    TOKEN_DEPLOYER_ADDRESS,
  );

  console.log(`\nDeployer token balance: ${deployerBalanceResult.result}`);

  // =========================================================================
  //
  // create liquidity pool
  //
  // =========================================================================

  // =========================================================================
  //
  // swap from ETH to token
  //
  // =========================================================================

  // // encode a swap on UniswapV2 from 10 ETH -> DAI
  // const swapData = tracer.swapCallEncoder.encodeSwapExactEthForTokens(
  //   '1000',  // not worried about slippage - only tracing
  //   [MAINNET_WETH_ADDRESS, MAINNET_DAI_ADDRESS],
  //   MY_DEV_ADDRESS,
  //   MAX_UINT_256,  // never expires
  // );
  //
  // // prepare swap tx
  // const swapTx = {
  //   from: MY_DEV_ADDRESS,
  //   to: MAINNET_UNISWAPV2_ROUTER,
  //   value: TEN_ETH,
  //   data: swapData,
  // }

  // =========================================================================
  //
  // trace the swap and cache the state changes
  //
  // =========================================================================

  // // trace swap tx and cache state
  // const result1 = await tracer.traceCall({...swapTx}, {
  //   traceType: TraceType.state,
  //   balanceOverride: ONE_HUNDRED_ETH,
  //   useCachedState: false,
  //   cacheStateFromTrace: true,
  // });
  //
  // console.log('\nTrace result for swap from ETH -> DAI:');
  // console.log('===========================================================\n');
  //
  // console.log(util.inspect({
  //   ...result1,
  //   result: 'hidden'  // <--- comment this line to see full trace result
  // }, false, null, true));

  // =========================================================================
  //
  // check the balance of token with eth_call using state changes
  //
  // =========================================================================

  // // uses cached state by default
  // const balanceResult = await tracer.getTokenBalance(
  //   MAINNET_DAI_ADDRESS,
  //   MY_DEV_ADDRESS,
  // );
  //
  // console.log(`\nDecoded balance: ${balanceResult.result}`);

  // =========================================================================
  //
  // trace approval for router to spend token
  //
  // =========================================================================

  // check allowance

  // =========================================================================
  //
  // sell tokens
  //
  // =========================================================================

  // check balance
})();
