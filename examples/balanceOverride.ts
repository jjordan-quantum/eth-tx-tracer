import {Tracer} from "../src";
import * as util from "util";

const Web3Utils = require('web3-utils');
import { config } from "dotenv";
import {ZERO_ADDRESS} from "../src/lib/constants";

const MY_DEV_ADDRESS: string = '0x6b8fA3E8E2FDABC3d9Cd5985Ee294aa44B82B351';
const ONE_THOUSAND_ETH = Web3Utils.toWei('1000', 'ether');

config();

// you only need this if you are not using ssl for your nodes - shhhhhh
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = String(0);

const jsonRpcUrl = process.env.JSON_RPC_URL as string;
const tracer = new Tracer({jsonRpcUrl});

(async () => {
  // =========================================================================
  //
  // try burning 1000 ETH with eth_call - expect an error
  //
  // =========================================================================

  const tx = {
    from: MY_DEV_ADDRESS,
    to: ZERO_ADDRESS,
    value: ONE_THOUSAND_ETH,
  }

  const result0 = await tracer.ethCall({...tx}, {
    useCachedState: false,
    usePendingBlock: false,
  });

  console.log('EthCallFetcher result without overrides:');
  console.log('=============================================\n');
  console.log(util.inspect(result0, false, null, true));

  // =========================================================================
  //
  // try burning 1000 ETH with eth_call using balance overrides
  //
  // =========================================================================

  const result1 = await tracer.ethCall({...tx}, {
    balanceOverride: ONE_THOUSAND_ETH,
    useCachedState: false,
    usePendingBlock: false,
  });

  console.log('\nEthCallFetcher result with overrides:');
  console.log('=============================================\n');
  console.log(util.inspect(result1, false, null, true));
})();
