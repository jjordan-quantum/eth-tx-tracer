import Contract from "web3-eth-contract";
import {MAINNET_UNISWAPV2_ROUTER} from "../../lib/constants";
import {UniswapV2Router02ABI} from "../../abis/UniswapV2Router02ABI";

export class UniswapV2SwapEncoder {
  contract: Contract;

  constructor() {
    this.contract = new Contract(UniswapV2Router02ABI as any[], MAINNET_UNISWAPV2_ROUTER);
  }

  encodeSwapExactEthForTokens(
    amountOut: string,
    path: string[],
    recipient: string,
    deadline: string,
  ): string {
    return this.contract.methods.swapExactETHForTokens(
      amountOut,
      path,
      recipient,
      deadline
    ).encodeABI();
  }

  encodeSwapExactTokensForEth(
    amountIn: string,
    amountOutMin: string,
    path: string[],
    recipient: string,
    deadline: string,
  ): string {
    return this.contract.methods.swapExactTokensForETH(
      amountIn,
      amountOutMin,
      path,
      recipient,
      deadline
    ).encodeABI();
  }

  encodeAddLiquidityEth(
    token: string,
    amountTokenDesired: string,
    amountTokenMin: string,
    amountETHMin: string,
    recipient: string,
    deadline: string,
  ): string {
    return this.contract.methods.addLiquidityETH(
      token,
      amountTokenDesired,
      amountTokenMin,
      amountETHMin,
      recipient,
      deadline
    ).encodeABI();
  }
}
