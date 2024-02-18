const Web3Utils = require('web3-utils');
import {config} from "dotenv";
config();

export const MY_DEV_ADDRESS: string = '0x6b8fA3E8E2FDABC3d9Cd5985Ee294aa44B82B351';
export const TX_SENDER: string = '0xCAb0EdD72491cbAC069C6fDc4229e044fE894B58';
export const ONE_THOUSAND_ETH = Web3Utils.toWei('1000', 'ether');
export const ONE_HUNDRED_ETH = Web3Utils.toWei('100', 'ether');
export const TEN_ETH = Web3Utils.toWei('10', 'ether');
export const TEN_USDC = '10000000';
export const ONE_ETH = Web3Utils.toWei('1', 'ether');
export const JSON_RPC_URL = process.env.JSON_RPC_URL as string;

// you only need this if you are using self-signed ssl for your node - shhhhhh
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = String(0);