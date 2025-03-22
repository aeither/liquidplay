import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { HexInput, MoveStructId } from "@aptos-labs/ts-sdk";
import {
    Aptos,
    AptosConfig,
    Ed25519PrivateKey,
    Network,
    PrivateKey,
    PrivateKeyVariants,
} from "@aptos-labs/ts-sdk";
import { AgentRuntime, LocalSigner } from "move-agent-kit";

// Create the Aptos config and runtime
const createAgentRuntime = async (networkName: 'MAINNET' | 'TESTNET' | 'DEVNET' = 'MAINNET') => {
  // Get private key from environment variable
  const privateKeyValue = process.env.PRIVATE_KEY;
  
  if (!privateKeyValue) {
    throw new Error('Private key is required but not found in environment variables');
  }

  // Setup Aptos configuration based on specified network
  const network = Network[networkName];
  const aptosConfig = new AptosConfig({ network });
  const aptos = new Aptos(aptosConfig);
  
  // Derive account from private key
  const account = await aptos.deriveAccountFromPrivateKey({
    privateKey: new Ed25519PrivateKey(
      PrivateKey.formatPrivateKey(privateKeyValue as HexInput, PrivateKeyVariants.Ed25519)
    ),
  });

  // Create signer and agent runtime
  const signer = new LocalSigner(account, network);
  const agentRuntime = new AgentRuntime(signer, aptos);

  return { agentRuntime, account };
};

// Tool for creating an Aries profile
export const createAriesProfileTool = createTool({
  id: 'create-aries-profile',
  description: 'Create a profile on Aries protocol',
  inputSchema: z.object({
    network: z.enum(['MAINNET', 'TESTNET', 'DEVNET']).default('MAINNET').describe('The Aptos network to use'),
  }),
  outputSchema: z.object({
    transactionHash: z.string(),
  }),
  execute: async ({ context }) => {
    const { agentRuntime } = await createAgentRuntime(context.network as 'MAINNET' | 'TESTNET' | 'DEVNET');
    const transactionHash = await agentRuntime.createAriesProfile();
    return { transactionHash };
  },
});

// Tool for lending tokens on Aries protocol
export const lendAriesTokensTool = createTool({
  id: 'lend-aries-tokens',
  description: 'Lend tokens on Aries protocol',
  inputSchema: z.object({
    amount: z.number().positive().describe('Amount of tokens to lend'),
    mintType: z.string().describe('Token mint type'),
    network: z.enum(['MAINNET', 'TESTNET', 'DEVNET']).default('MAINNET').describe('The Aptos network to use'),
  }),
  outputSchema: z.object({
    transactionHash: z.string(),
  }),
  execute: async ({ context }) => {
    const { agentRuntime } = await createAgentRuntime(context.network as 'MAINNET' | 'TESTNET' | 'DEVNET');
    const transactionHash = await agentRuntime.lendAriesToken(
      context.mintType as unknown as MoveStructId,
      context.amount
    );
    return { transactionHash };
  },
});

// Tool for borrowing tokens on Aries protocol
export const borrowAriesTokensTool = createTool({
  id: 'borrow-aries-tokens',
  description: 'Borrow tokens on Aries protocol',
  inputSchema: z.object({
    amount: z.number().positive().describe('Amount of tokens to borrow'),
    mintType: z.string().describe('Token mint type'),
    network: z.enum(['MAINNET', 'TESTNET', 'DEVNET']).default('MAINNET').describe('The Aptos network to use'),
  }),
  outputSchema: z.object({
    transactionHash: z.string(),
  }),
  execute: async ({ context }) => {
    const { agentRuntime } = await createAgentRuntime(context.network as 'MAINNET' | 'TESTNET' | 'DEVNET');
    const transactionHash = await agentRuntime.borrowAriesToken(
      context.mintType as unknown as MoveStructId,
      context.amount
    );
    return { transactionHash };
  },
});

// Tool for withdrawing tokens from Aries protocol
export const withdrawAriesTokensTool = createTool({
  id: 'withdraw-aries-tokens',
  description: 'Withdraw lent tokens from Aries protocol',
  inputSchema: z.object({
    amount: z.number().positive().describe('Amount of tokens to withdraw'),
    mintType: z.string().describe('Token mint type'),
    network: z.enum(['MAINNET', 'TESTNET', 'DEVNET']).default('MAINNET').describe('The Aptos network to use'),
  }),
  outputSchema: z.object({
    transactionHash: z.string(),
  }),
  execute: async ({ context }) => {
    const { agentRuntime } = await createAgentRuntime(context.network as 'MAINNET' | 'TESTNET' | 'DEVNET');
    const transactionHash = await agentRuntime.withdrawAriesToken(
      context.mintType as unknown as MoveStructId,
      context.amount
    );
    return { transactionHash };
  },
});

// Tool for repaying tokens on Aries protocol
export const repayAriesTokensTool = createTool({
  id: 'repay-aries-tokens',
  description: 'Repay borrowed tokens on Aries protocol',
  inputSchema: z.object({
    amount: z.number().positive().describe('Amount of tokens to repay'),
    mintType: z.string().describe('Token mint type'),
    network: z.enum(['MAINNET', 'TESTNET', 'DEVNET']).default('MAINNET').describe('The Aptos network to use'),
  }),
  outputSchema: z.object({
    transactionHash: z.string(),
  }),
  execute: async ({ context }) => {
    const { agentRuntime } = await createAgentRuntime(context.network as 'MAINNET' | 'TESTNET' | 'DEVNET');
    const transactionHash = await agentRuntime.repayAriesToken(
      context.mintType as unknown as MoveStructId,
      context.amount
    );
    return { transactionHash };
  },
});
