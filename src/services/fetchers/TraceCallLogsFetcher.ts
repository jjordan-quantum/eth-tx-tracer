import axios from "axios";
import {CustomLogTracer} from "../../lib/constants";
const Web3Utils = require('web3-utils');

export type TracedLog = {
  address: string,
  data?: string,
  topic0?: string,
  topic1?: string,
  topic2?: string,
  topic3?: string,
}

export type LogTracerResult = {
  success: boolean,
  message?: string,
  error?: any,

  logs?: TracedLog[],
}

class TraceCallLogsFetcher {
  async apply(
    jsonRpcUrl: string,
    tx: any,
    blockNumber?: number,
    _overrides?: any,
    _blockoverrides?: any,
  ): Promise<LogTracerResult> {
    try {
      const traceTx: any = {
        from: tx.from,
        data: tx.input ? tx.input : (tx.data ? tx.data : '0x')
      };

      if(tx.to) {
        traceTx.to = tx.to;
      }

      if(tx.value) {
        traceTx.value = Web3Utils.numberToHex(tx.value);
      }

      const blockNumberString: string = blockNumber ? Web3Utils.toHex(blockNumber) : 'latest';

      const options: any = {
        tracer: CustomLogTracer,
        enableMemory: false,
        enableReturnData: false,
        disableStorage: true
      };

      if(_overrides) {
        options.stateOverrides = {..._overrides};
      }

      if(_blockoverrides) {
        options.blockoverrides = {..._blockoverrides};
      }

      const response = await axios
        .post(
          jsonRpcUrl,
          {
            'jsonrpc': '2.0',
            'method': 'debug_traceCall',
            'params': [
              traceTx,
              blockNumberString,
              {...options}
            ],
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
          message: 'Response undefined for trace',
        };
      }

      if(!response.data) {
        return {
          success: false,
          message: 'Data undefined in response for trace',
        };
      }

      if(!response.data.result) {
        return {
          success: false,
          message: 'Result undefined in response for trace',
        };
      }

      return {
        success: true,
        logs: JSON.parse(JSON.stringify(response.data.result)),
      }
    } catch(e) {
      return {
        success: false,
        message: `Error tracing logs`,
        error: e,
      };
    }
  }
}

export default TraceCallLogsFetcher;
