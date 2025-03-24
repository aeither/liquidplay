import {
  AccountAddress,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  type HexInput,
  type MoveStructId,
  Network,
  PrivateKey,
  PrivateKeyVariants
} from "@aptos-labs/ts-sdk";
import { createTool } from '@mastra/core/tools';
import { AgentRuntime, LocalSigner } from "move-agent-kit";
import { z } from 'zod';

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

// Tool for lending tokens on Joule Finance
export const lendJouleFinanceTool = createTool({
  id: 'lend-joule-finance',
  description: 'Lend tokens on Joule Finance',
  inputSchema: z.object({
    amount: z.number().describe('Amount of tokens to lend'),
    mint: z.string().describe('Token mint address'),
    positionId: z.string().describe('Position ID'),
    newPosition: z.boolean().default(false).describe('Whether this is a new position'),
    fungibleAsset: z.boolean().default(false).describe('Whether the token is a fungible asset'),
    network: z.enum(['MAINNET', 'TESTNET', 'DEVNET']).default('MAINNET').describe('The Aptos network to use'),
  }),
  outputSchema: z.object({
    hash: z.string(),
    positionId: z.string(),
  }),
  execute: async ({ context }) => {
    const { agentRuntime } = await createAgentRuntime(context.network as 'MAINNET' | 'TESTNET' | 'DEVNET');
    return await agentRuntime.lendToken(
      context.amount,
      context.mint as MoveStructId,
      context.positionId,
      context.newPosition,
      false // context.fungibleAsset
    );
  },
});

// Tool for withdrawing tokens from Joule Finance
export const withdrawJouleFinanceTool = createTool({
  id: 'withdraw-joule-finance',
  description: 'Withdraw tokens from Joule Finance',
  inputSchema: z.object({
    amount: z.number().describe('Amount of tokens to withdraw'),
    mint: z.string().describe('Token mint address'),
    positionId: z.string().describe('Position ID'),
    fungibleAsset: z.boolean().default(false).describe('Whether the token is a fungible asset'),
    network: z.enum(['MAINNET', 'TESTNET', 'DEVNET']).default('MAINNET').describe('The Aptos network to use'),
  }),
  outputSchema: z.object({
    hash: z.string(),
    positionId: z.string(),
  }),
  execute: async ({ context }) => {
    const { agentRuntime } = await createAgentRuntime(context.network as 'MAINNET' | 'TESTNET' | 'DEVNET');
    return await agentRuntime.withdrawToken(
      context.amount,
      context.mint as MoveStructId,
      context.positionId,
      false // context.fungibleAsset
    );
  },
});

// Tool for borrowing tokens from Joule Finance
export const borrowJouleFinanceTool = createTool({
  id: 'borrow-joule-finance',
  description: 'Borrow tokens from Joule Finance',
  inputSchema: z.object({
    amount: z.number().describe('Amount of tokens to borrow'),
    mint: z.string().describe('Token mint address'),
    positionId: z.string().describe('Position ID'),
    fungibleAsset: z.boolean().default(false).describe('Whether the token is a fungible asset'),
    network: z.enum(['MAINNET', 'TESTNET', 'DEVNET']).default('MAINNET').describe('The Aptos network to use'),
  }),
  outputSchema: z.object({
    hash: z.string(),
    positionId: z.string(),
  }),
  execute: async ({ context }) => {
    const { agentRuntime } = await createAgentRuntime(context.network as 'MAINNET' | 'TESTNET' | 'DEVNET');
    return await agentRuntime.borrowToken(
      context.amount,
      context.mint as MoveStructId,
      context.positionId,
      false // context.fungibleAsset
    );
  },
});

// Tool for repaying tokens to Joule Finance
export const repayJouleFinanceTool = createTool({
  id: 'repay-joule-finance',
  description: 'Repay borrowed tokens to Joule Finance',
  inputSchema: z.object({
    amount: z.number().describe('Amount of tokens to repay'),
    mint: z.string().describe('Token mint address'),
    positionId: z.string().describe('Position ID'),
    fungibleAsset: z.boolean().default(false).describe('Whether the token is a fungible asset'),
    network: z.enum(['MAINNET', 'TESTNET', 'DEVNET']).default('MAINNET').describe('The Aptos network to use'),
  }),
  outputSchema: z.object({
    hash: z.string(),
    positionId: z.string(),
  }),
  execute: async ({ context }) => {
    const { agentRuntime } = await createAgentRuntime(context.network as 'MAINNET' | 'TESTNET' | 'DEVNET');
    return await agentRuntime.repayToken(
      context.amount,
      context.mint as MoveStructId,
      context.positionId,
      false // context.fungibleAsset
    );
  },
});

// Tool for getting user position details
export const getUserPositionTool = createTool({
  id: 'get-user-position',
  description: 'Get details of a specific user position on Joule Finance',
  inputSchema: z.object({
    positionId: z.string().describe('Position ID'),
    userAddress: z.string().optional().describe('User address (defaults to the current wallet)'),
    network: z.enum(['MAINNET', 'TESTNET', 'DEVNET']).default('MAINNET').describe('The Aptos network to use'),
  }),
  outputSchema: z.object({
    position: z.any()
  }),
  execute: async ({ context }) => {
    const { agentRuntime, account } = await createAgentRuntime(context.network as 'MAINNET' | 'TESTNET' | 'DEVNET');
    const userAddress = context.userAddress
      ? AccountAddress.fromString(context.userAddress)
      : account.accountAddress;

    const position = await agentRuntime.getUserPosition(userAddress, context.positionId);

    return { position };
  },
});

// Tool for getting all user positions
export const getAllUserPositionsTool = createTool({
  id: 'get-all-user-positions',
  description: 'Get all positions for a user on Joule Finance',
  inputSchema: z.object({
    userAddress: z.string().optional().describe('User address (defaults to the current wallet)'),
    network: z.enum(['MAINNET', 'TESTNET', 'DEVNET']).default('MAINNET').describe('The Aptos network to use'),
  }),
  outputSchema: z.object({
    positions: z.any()
  }),
  execute: async ({ context }) => {
    const { agentRuntime, account } = await createAgentRuntime(context.network as 'MAINNET' | 'TESTNET' | 'DEVNET');
    const userAddress = context.userAddress
      ? AccountAddress.fromString(context.userAddress)
      : account.accountAddress;

    const positions = await agentRuntime.getUserAllPositions(userAddress);

    return { positions };
  },
});
