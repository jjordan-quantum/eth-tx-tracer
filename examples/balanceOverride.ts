import {Tracer} from "../src";
import * as util from "util";

import {ZERO_ADDRESS} from "../src/lib/constants";
import {JSON_RPC_URL, MY_DEV_ADDRESS, ONE_THOUSAND_ETH} from "./constants";

const tracer = new Tracer({jsonRpcUrl: JSON_RPC_URL});

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
  console.log('===========================================================\n');
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
  console.log('===========================================================\n');
  console.log(util.inspect(result1, false, null, true));
})();
