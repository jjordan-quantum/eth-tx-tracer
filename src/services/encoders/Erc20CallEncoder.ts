import Contract from "web3-eth-contract";
import {UniswapV2ERC20ABI} from "../../abis/UnipswapV2ERC20ABI";
import {MAINNET_USDC_ADDRESS} from "../../lib/constants";

export class Erc20CallEncoder {
  contract: Contract<any>;

  constructor() {
    this.contract = new Contract(UniswapV2ERC20ABI, MAINNET_USDC_ADDRESS);
  }

  encodeTotalSupply(address: string): string {
    return this.contract.methods.totalSupply().encodeABI();
  }

  encodeName(address: string): string {
    return this.contract.methods.name().encodeABI();
  }

  encodeSymbol(address: string): string {
    return this.contract.methods.symbol().encodeABI();
  }

  encodeDecimals(address: string): string {
    return this.contract.methods.decimals().encodeABI();
  }

  encodeBalanceOf(address: string, owner: string): string {
    return this.contract.methods.balanceOf(owner).encodeABI();
  }

  encodeAllowance(address: string, owner: string, spender: string): string {
    return this.contract.methods.allowance(owner, spender).encodeABI();
  }

  encodeApproval(
    spender: string,
    amount: any
  ): string {
    return this.contract.methods.approve(spender, amount).encodeABI();
  }

  encodeTransfer(
    recipient: string,
    amount: any
  ): string {
    return this.contract.methods.transfer(recipient, amount).encodeABI();
  }

  encodeTransferFrom(
    sender: string,
    recipient: string,
    amount: any
  ): string {
    return this.contract.methods.transferFrom(sender, recipient, amount).encodeABI();
  }
}
