import Contract from "web3-eth-contract";
import {UniswapV2ERC20ABI} from "../../abis/UnipswapV2ERC20ABI";
import {MAINNET_USDC_ADDRESS} from "../../lib/constants";
const Web3EthAbi = require('web3-eth-abi');

export class Erc20CallDecoder {
  contract: Contract;

  constructor(contract?: Contract) {
    this.contract = contract || new Contract(UniswapV2ERC20ABI as any[], MAINNET_USDC_ADDRESS);
  }

  decodeTotalSupply(result: string): any {
    // TODO
  }

  decodeName(result: string): any {
    // TODO
  }

  decodeSymbol(result: string): any {
    // TODO
  }

  decodeDecimals(result: string): any {
    // TODO
  }

  decodeBalanceOf(result: string): string | undefined {
    const decodedReturnData: any = Web3EthAbi.decodeParameters(
      ['uint256'],
      result,
    );

    if(!decodedReturnData) {
      return undefined;
    }

    if(decodedReturnData.length === 0) {
      return undefined;
    }

    return decodedReturnData[0];
  }

  decodeAllowance(result: string): any {
    const decodedReturnData: any = Web3EthAbi.decodeParameters(
      ['uint256'],
      result,
    );

    if(!decodedReturnData) {
      return undefined;
    }

    if(decodedReturnData.length === 0) {
      return undefined;
    }

    return decodedReturnData[0];
  }

  decodeApproval(result: string): any {
    // TODO
  }

  decodeTransfer(result: string): any {
    // TODO
  }

  decodeTransferFrom(result: string): any {
    // TODO
  }
}
