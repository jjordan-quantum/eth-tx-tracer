import axios from "axios";
const Web3Utils = require('web3-utils');

export type EthCallFetcherResult = {
  success: boolean,
  message?: string,
  error?: any,
  result?: string,
}

class EthCallFetcher {
  static async apply(
    jsonRpcUrl: string,
    tx: any,
    blockNumber?: number,
    overrides?: any,
    usePendingBlock?: boolean,
  ): Promise<EthCallFetcherResult> {
    try {
      const sendTxn: any = {
        from: tx.from,
        data: tx.input ? tx.input : (tx.data ? tx.data : '0x'),
      };

      if(tx.to) {
        sendTxn.to = tx.to;
      }

      if(tx.value) {
        sendTxn.value = Web3Utils.numberToHex(String(tx.value));
      }

      const blockNumberString: string = blockNumber
        ? Web3Utils.toHex(blockNumber)
        : (usePendingBlock ? 'pending' : 'latest');

      const params: any[] = [
        sendTxn,
        blockNumberString,
      ];

      if(overrides) {
        params.push({...overrides});
      }

      const response = await axios
        .post(
          jsonRpcUrl,
          {
            'jsonrpc': '2.0',
            'method': 'eth_call',
            'params': params.slice(),
            'id': 1
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

      if(!response) {
        return {
          success: false,
          message: 'response undefined from eth_call',
        }
      }

      if(!response.data) {
       return {
          success: false,
          message: 'data undefined in response from eth_call',
        }
      }

      if(!response.data.result) {
        if(response.data.error) {
          return {
            success: false,
            message: 'eth_call error',
            error: response.data.error,
          }
        } else {
          return {
            success: false,
            message: 'result undefined in response from eth_call',
          }
        }
      }

      return {
        success: true,
        result: response.data.result,
      };
    } catch(e) {
    return {
        success: false,
        error: e,
        message: 'Error while fetching eth_call result',
      }
    }
  }
}

export default EthCallFetcher;
