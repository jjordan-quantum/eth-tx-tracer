import {Tracer} from "../src";
import * as util from "util";

import {
  JSON_RPC_URL, MY_DEV_ADDRESS, ONE_HUNDRED_ETH,
  SIMPLE_TOKEN_BYTECODE, TEN_ETH, TEN_USDC,
  TOKEN_DEPLOYER_ADDRESS, TX_SENDER
} from "./constants";
import {TraceType} from "../src/lib/types";
import {
  MAINNET_DAI_ADDRESS,
  MAINNET_UNISWAPV2_ROUTER,
  MAINNET_USDC_ADDRESS,
  MAINNET_WETH_ADDRESS, MAX_UINT_256
} from "../src/lib/constants";

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

  const deployerTokenBalance = deployerBalanceResult.result;
  console.log(`\nDeployer token balance: ${deployerTokenBalance}`);

  // =========================================================================
  //
  // approve router to spend new token
  //
  // =========================================================================

  const approvalData = tracer.erc20CallEncoder.encodeApproval(
    MAINNET_UNISWAPV2_ROUTER,
    deployerTokenBalance,
  );

  const approvalTx = {
    from: TOKEN_DEPLOYER_ADDRESS,
    to: tokenAddress,
    data: approvalData,
  }

  const result1 = await tracer.traceCall({...approvalTx}, {
    traceType: TraceType.state,
    balanceOverride: TEN_ETH,
    useCachedState: true,
    cacheStateFromTrace: true,
  });

  console.log('\nTrace result for approval tx:');
  console.log('===========================================================\n');

  console.log(util.inspect({
    ...result1,
    result: 'hidden'  // <--- comment this line to see full trace result
  }, false, null, true));

  // =========================================================================
  //
  // check allowance using cached state
  //
  // =========================================================================

  // uses cached state by default
  const allowanceResult1 = await tracer.getTokenAllowance(
    tokenAddress,
    TOKEN_DEPLOYER_ADDRESS,
    MAINNET_UNISWAPV2_ROUTER,
  );

  console.log(`\nUniswapV2 allowance to spend deployer's tokens: ${allowanceResult1.result}`);

  // =========================================================================
  //
  // create liquidity pool
  //
  // =========================================================================

  // encode an add liquidity txn on UniswapV2 for 10 ETH + new token
  const addLiquidityTxData = tracer.swapCallEncoder.encodeAddLiquidityEth(
    tokenAddress,
    deployerTokenBalance as string,
    '0',
    '0',
    TOKEN_DEPLOYER_ADDRESS,
    MAX_UINT_256,  // never expires
  );

  // prepare swap tx
  const addLiquidityTx = {
    from: TOKEN_DEPLOYER_ADDRESS,
    to: MAINNET_UNISWAPV2_ROUTER,
    value: TEN_ETH,
    data: addLiquidityTxData,
  }

  // trace swap tx and cache state
  const result2 = await tracer.traceCall({...addLiquidityTx}, {
    traceType: TraceType.state,
    balanceOverride: ONE_HUNDRED_ETH,
    useCachedState: true,
    cacheStateFromTrace: true,
  });

  console.log('\nTrace result for adding liquidity:');
  console.log('===========================================================\n');

  console.log(util.inspect({
    ...result2,
    result: 'hidden'  // <--- comment this line to see full trace result
  }, false, null, true));

  const lpAddress: string = result2.newContracts ? result2.newContracts[0] : '';
  console.log(`\nNew liquidity pool address: ${lpAddress}`);

  // =========================================================================
  //
  // swap from ETH to token, from a different address
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
