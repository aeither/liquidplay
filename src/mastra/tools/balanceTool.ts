// check balance tool

import {
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  type HexInput,
  Network,
  PrivateKey,
  PrivateKeyVariants,
} from "@aptos-labs/ts-sdk";
import { createTool } from '@mastra/core/tools';
import { AgentRuntime, LocalSigner } from "move-agent-kit";
import { z } from 'zod';

// Tool for checking a wallet's balance
export const balanceTool = createTool({
  id: 'get-balance',
  description: 'Get the current balance of an Aptos wallet',
  inputSchema: z.object({}),
  outputSchema: z.object({
    address: z.string(),
    balance: z.string(),
    network: z.string(),
  }),
  execute: async () => {
    return await getWalletBalance();
  },
});

const getWalletBalance = async () => {
  // Get private key from environment variable
  const privateKeyValue = process.env.PRIVATE_KEY;

  if (!privateKeyValue) {
    throw new Error('Private key is required but not found in environment variables');
  }

  // Setup Aptos configuration for MAINNET
  const aptosConfig = new AptosConfig({ network: Network.MAINNET });
  const aptos = new Aptos(aptosConfig);

  // Derive account from private key
  const account = await aptos.deriveAccountFromPrivateKey({
    privateKey: new Ed25519PrivateKey(
      PrivateKey.formatPrivateKey(privateKeyValue as HexInput, PrivateKeyVariants.Ed25519)
    ),
  });

  // Create signer and agent runtime
  const signer = new LocalSigner(account, Network.MAINNET);
  const agentRuntime = new AgentRuntime(signer, aptos);

  // Get balance
  const balance = await agentRuntime.getBalance();

  return {
    address: account.accountAddress.toString(),
    balance: balance.toString(),
    network: 'MAINNET',
  };
};