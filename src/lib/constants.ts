import BigNumber from "bignumber.js";

export const MAINNET_USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
export const MAINNET_DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const MAINNET_UNISWAPV2_ROUTER = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';
export const MAINNET_WETH_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
export const MAX_UINT_256_HEX = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
export const MAX_UINT_256 = (new BigNumber(MAX_UINT_256_HEX)).toFixed(0);

export const CustomLogTracer = "{\n" +
  "    data: [],\n" +
  "    fault: function (log) {\n" +
  "    },\n" +
  "    byte2Hex: function (byte) {\n" +
  "        if (byte < 0x10)\n" +
  "            return '0' + byte.toString(16);\n" +
  "        return byte.toString(16);\n" +
  "    },\n" +
  "    array2Hex: function (arr) {\n" +
  "        var retVal = '';\n" +
  "        for (var i=0; i<arr.length; i++)\n" +
  "            retVal += this.byte2Hex(arr[i]);\n" +
  "        return retVal;\n" +
  "    },\n" +
  "    step: function (log) {\n" +
  "        var topicCount = (log.op.toString().match(/LOG(\\d)/) || [])[1];\n" +
  "        if (topicCount) {\n" +
  "            var res = {\n" +
  "                address: '0x' + this.array2Hex(log.contract.getAddress()),\n" +
  "                data: '0x' + this.array2Hex(log.memory.slice(parseInt(log.stack.peek(0)), parseInt(log.stack.peek(0)) + parseInt(log.stack.peek(1)))),\n" +
  "            };\n" +
  "            for (var i = 0; i < topicCount; i++)\n" +
  "                res['topic' + i.toString()] = '0x' + log.stack.peek(i + 2).toString(16);\n" +
  "            this.data.push(res);\n" +
  "        }\n" +
  "    },\n" +
  "    result: function () {\n" +
  "        return this.data;\n" +
  "    }\n" +
  "}"
