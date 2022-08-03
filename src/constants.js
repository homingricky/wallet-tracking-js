// Globals

import dotenv from "dotenv";
dotenv.config();

import { ethers } from "ethers";
import { logError } from "./logging.js";

let hasEnv = true;

const ENV_VARS = [
  "RPC_URL",
  "RPC_URL_WSS",
];

for (let i = 0; i < ENV_VARS.length; i++) {
  if (!process.env[ENV_VARS[i]]) {
    logError(`Missing env var ${ENV_VARS[i]}`);
    hasEnv = false;
  }
}

if (!hasEnv) {
  process.exit(1);
}

// Providers
export const provider = new ethers.providers.JsonRpcProvider(
  process.env.RPC_URL
);
export const wssProvider = new ethers.providers.WebSocketProvider(
  process.env.RPC_URL_WSS
);