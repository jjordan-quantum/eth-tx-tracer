import {Tracer} from "../src";
import * as util from "util";

import {
  JSON_RPC_URL, ONE_ETH, ONE_HUNDRED_ETH,
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
import BigNumber from "bignumber.js";

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
    //result: 'hidden'  // <--- comment this line to see full trace result
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
  // approve router to spend new token on behalf of deployer
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

  const addLiquidityAmount = (new BigNumber(deployerTokenBalance as string)).div(new BigNumber('10')).toFixed(0);

  // encode an add liquidity txn on UniswapV2 for 10 ETH + new token
  const addLiquidityTxData = tracer.swapCallEncoder.encodeAddLiquidityEth(
    tokenAddress,
    addLiquidityAmount,
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
    //result: 'hidden'  // <--- comment this line to see full trace result
  }, false, null, true));

  const lpAddress: string = result2.newContracts ? result2.newContracts[0] : '';
  console.log(`\nNew liquidity pool address: ${lpAddress}`);

  // =========================================================================
  //
  // check deployer balance after addubg liquidity
  //
  // =========================================================================

  // uses cached state by default
  const deployerBalanceResult1 = await tracer.getTokenBalance(
    tokenAddress,
    TOKEN_DEPLOYER_ADDRESS,
  );

  const deployerTokenBalance1 = deployerBalanceResult1.result;
  console.log(`\nDeployer token balance after adding liquidity: ${deployerTokenBalance1}`);

  // =========================================================================
  //
  // swap 1 ETH to token, from a different address
  //
  // =========================================================================

  // encode a swap on UniswapV2 from 10 ETH -> DAI
  const swapData = tracer.swapCallEncoder.encodeSwapExactEthForTokens(
    '0',  // not worried about slippage - only tracing
    [MAINNET_WETH_ADDRESS, tokenAddress],
    TOKEN_DEPLOYER_ADDRESS,
    MAX_UINT_256,  // never expires
  );

  // prepare swap tx
  const swapTx = {
    from: TOKEN_DEPLOYER_ADDRESS,
    to: MAINNET_UNISWAPV2_ROUTER,
    value: ONE_ETH,
    data: swapData,
  }

  // trace swap tx and cache state
  const result3 = await tracer.traceCall({...swapTx}, {
    traceType: TraceType.state,
    balanceOverride: TEN_ETH,
    useCachedState: true,
    cacheStateFromTrace: true,
  });

  console.log('\nTrace result for swap from ETH -> token:');
  console.log('===========================================================\n');

  console.log(util.inspect({
    ...result3,
    result: 'hidden'  // <--- comment this line to see full trace result
  }, false, null, true));

  // =========================================================================
  //
  // check the balance of token with eth_call using state changes
  //
  // =========================================================================

  // uses cached state by default
  const balanceResult = await tracer.getTokenBalance(
    tokenAddress,
    TOKEN_DEPLOYER_ADDRESS,
  );

  const buyerTokenBalance = balanceResult.result;
  console.log(`\nToken balance after swap: ${buyerTokenBalance}`);

  // =========================================================================
  //
  // trace approval for router to sell tokens that were just bought with ETH
  //
  // =========================================================================

  const approvalData1 = tracer.erc20CallEncoder.encodeApproval(
    MAINNET_UNISWAPV2_ROUTER,
    buyerTokenBalance,
  );

  const approvalTx1 = {
    from: TOKEN_DEPLOYER_ADDRESS,
    to: tokenAddress,
    data: approvalData1,
  }

  const result4 = await tracer.traceCall({...approvalTx1}, {
    traceType: TraceType.state,
    balanceOverride: TEN_ETH,
    useCachedState: true,
    cacheStateFromTrace: true,
  });

  console.log('\nTrace result for approval tx:');
  console.log('===========================================================\n');

  console.log(util.inspect({
    ...result4,
    result: 'hidden'  // <--- comment this line to see full trace result
  }, false, null, true));

  // =========================================================================
  //
  // check allowance using cached state
  //
  // =========================================================================

  // uses cached state by default
  const allowanceResult2 = await tracer.getTokenAllowance(
    tokenAddress,
    TOKEN_DEPLOYER_ADDRESS,
    MAINNET_UNISWAPV2_ROUTER,
  );

  console.log(`\nUniswapV2 allowance to spend buyer's tokens: ${allowanceResult2.result}`);

  // =========================================================================
  //
  // sell tokens
  //
  // =========================================================================

  // encode a swap on UniswapV2 from 10 ETH -> DAI
  const sellSwapData = tracer.swapCallEncoder.encodeSwapExactTokensForEth(
    buyerTokenBalance as string,
    '0',  // not worried about slippage - only tracing
    [tokenAddress, MAINNET_WETH_ADDRESS],
    TOKEN_DEPLOYER_ADDRESS,
    MAX_UINT_256,  // never expires
  );

  // prepare swap tx
  const sellSwapTx = {
    from: TOKEN_DEPLOYER_ADDRESS,
    to: MAINNET_UNISWAPV2_ROUTER,
    data: sellSwapData,
  }

  // trace swap tx and cache state
  const result5 = await tracer.traceCall({...sellSwapTx}, {
    traceType: TraceType.state,
    balanceOverride: TEN_ETH,
    useCachedState: true,
    cacheStateFromTrace: true,
  });

  console.log('\nTrace result for swap from token -> ETH:');
  console.log('===========================================================\n');

  console.log(util.inspect({
    ...result5,
    result: 'hidden'  // <--- comment this line to see full trace result
  }, false, null, true));

  // =========================================================================
  //
  // check the balance of token with eth_call using state changes
  //
  // =========================================================================

  // uses cached state by default
  const balanceResult2 = await tracer.getTokenBalance(
    tokenAddress,
    TOKEN_DEPLOYER_ADDRESS,
  );

  const tokenBalanceAfterSell = balanceResult2.result;
  console.log(`\nToken balance after sell swap: ${tokenBalanceAfterSell}`);
})();
