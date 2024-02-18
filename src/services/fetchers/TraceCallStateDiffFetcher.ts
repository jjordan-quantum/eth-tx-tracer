import axios from "axios";
const Web3Utils = require('web3-utils');

export type StateDiffTracerResult = {
  success: boolean;
  error?: any;
  message?: string;
  result?: any;
  resultingOverrides?: any;
  targetAddress?: string;
  newContracts?: string[];
  foundTargetAddress?: boolean;
}

class TraceCallStateDiffFetcher {
  async apply(
    jsonRpcUrl: string,
    tx: any,
    targetAddress?: string,
    blockNumber?: number,
    _overrides?: any,
    _blockoverrides?: any,
  ): Promise<StateDiffTracerResult> {
    try {
      const traceTx: any = {
        from: tx.from,
        data: tx.input ? tx.input : (tx.data ? tx.data : '0x')
      };

      if(tx.to) {
        traceTx.to = tx.to;
      }

      if(tx.value) {
        traceTx.value = Web3Utils.toHex(tx.value);
      }

      const blockNumberString: string = blockNumber ? Web3Utils.toHex(blockNumber) : 'latest';

      const options: any = {
        tracer: 'prestateTracer',
        tracerConfig: { diffMode: true },
        enableMemory: false,
        disableStack: false,
        disableStorage: false,
        enableReturnData: true,
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

      console.log(response);

      if(!response) {
       return {
          success: false,
          message: 'response undefined',
          targetAddress,
        }
      }

      if(!response.data) {
       return {
          success: false,
          message: 'data undefined',
          targetAddress,
        }
      }

      if(!response.data.result) {
       return {
          success: false,
          message: 'result undefined',
          targetAddress,
        }
      }

      if(!response.data.result.post) {
       return {
          success: false,
          message: 'result undefined',
          targetAddress,
        }
      }

      const overrides: any = {}
      let foundTarget: boolean = false;
      const newContracts: string[] = [];

      for(const key of Object.keys(response.data.result.post)) {
        if(!key) { continue; }
        if(key.toLowerCase() === tx.from.toLowerCase()) { continue; }

        if(response.data.result.post[key] && response.data.result.post[key].hasOwnProperty('code')) {
          newContracts.push(key);
        }

        if(
          !!targetAddress
          && key.toLowerCase() === targetAddress.toLowerCase()
        ) { foundTarget = true; }

        const value: any = {}

        for(const subKey of Object.keys(response.data.result.post[key])) {
          const useSubKey: string = subKey === 'storage' ? 'stateDiff' : subKey;

          if(typeof(response.data.result.post[key][subKey]) === 'number') {
            value[useSubKey] = Web3Utils.toHex(response.data.result.post[key][subKey]);
          } else {
            value[useSubKey] = response.data.result.post[key][subKey]
          }
        }

        overrides[key] = value;
      }

      return {
        success: true,
        result: JSON.parse(JSON.stringify(response.data.result)),
        resultingOverrides: JSON.parse(JSON.stringify(overrides)),
        targetAddress,
        foundTargetAddress: foundTarget,
        newContracts: newContracts.slice(),
      }
    } catch(e) {
      return {
        success: false,
        message: 'Error while tracing for stateDiff',
        error: e,
      }
    }
  }
}

export default TraceCallStateDiffFetcher;
