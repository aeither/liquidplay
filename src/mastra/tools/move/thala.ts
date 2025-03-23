import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import type { HexInput, MoveStructId } from "@aptos-labs/ts-sdk";
import {
    Aptos,
    AptosConfig,
    Ed25519PrivateKey,
    Network,
    PrivateKey,
    PrivateKeyVariants
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

// Tool for staking tokens with Thala
export const stakeThalaTokensTool = createTool({
  id: 'stake-thala-tokens',
  description: 'Stake tokens with Thala protocol',
  inputSchema: z.object({
    amount: z.number().positive().describe('Amount of tokens to stake'),
    network: z.enum(['MAINNET', 'TESTNET', 'DEVNET']).default('MAINNET').describe('The Aptos network to use'),
  }),
  outputSchema: z.object({
    transactionHash: z.string(),
  }),
  execute: async ({ context }) => {
    const { agentRuntime } = await createAgentRuntime(context.network as 'MAINNET' | 'TESTNET' | 'DEVNET');
    const transactionHash = await agentRuntime.stakeTokensWithThala(context.amount);
    return { transactionHash };
  },
});

// Tool for unstaking tokens from Thala
export const unstakeThalaTokensTool = createTool({
  id: 'unstake-thala-tokens',
  description: 'Unstake tokens from Thala protocol',
  inputSchema: z.object({
    amount: z.number().positive().describe('Amount of tokens to unstake'),
    network: z.enum(['MAINNET', 'TESTNET', 'DEVNET']).default('MAINNET').describe('The Aptos network to use'),
  }),
  outputSchema: z.object({
    transactionHash: z.string(),
  }),
  execute: async ({ context }) => {
    const { agentRuntime } = await createAgentRuntime(context.network as 'MAINNET' | 'TESTNET' | 'DEVNET');
    const transactionHash = await agentRuntime.unstakeTokensWithThala(context.amount);
    return { transactionHash };
  },
});

// Tool for minting MOD with Thala
export const mintMODThalaTokensTool = createTool({
  id: 'mint-mod-thala',
  description: 'Mint MOD tokens with Thala protocol',
  inputSchema: z.object({
    amount: z.number().positive().describe('Amount of tokens to mint'),
    mintType: z.string().describe('Token mint type'),
    network: z.enum(['MAINNET', 'TESTNET', 'DEVNET']).default('MAINNET').describe('The Aptos network to use'),
  }),
  outputSchema: z.object({
    transactionHash: z.string(),
  }),
  execute: async ({ context }) => {
    const { agentRuntime } = await createAgentRuntime(context.network as 'MAINNET' | 'TESTNET' | 'DEVNET');
    const transactionHash = await agentRuntime.mintMODWithThala(
      context.mintType as MoveStructId,
      context.amount
    );
    return { transactionHash };
  },
});

// Tool for redeeming MOD with Thala
export const redeemMODThalaTokensTool = createTool({
  id: 'redeem-mod-thala',
  description: 'Redeem MOD tokens with Thala protocol',
  inputSchema: z.object({
    amount: z.number().positive().describe('Amount of tokens to redeem'),
    mintType: z.string().describe('Token mint type'),
    network: z.enum(['MAINNET', 'TESTNET', 'DEVNET']).default('MAINNET').describe('The Aptos network to use'),
  }),
  outputSchema: z.object({
    transactionHash: z.string(),
  }),
  execute: async ({ context }) => {
    const { agentRuntime } = await createAgentRuntime(context.network as 'MAINNET' | 'TESTNET' | 'DEVNET');
    const transactionHash = await agentRuntime.redeemMODWithThala(
      context.mintType as MoveStructId,
      context.amount
    );
    return { transactionHash };
  },
});

// Tool for adding liquidity with Thala
export const addLiquidityThalaTokensTool = createTool({
  id: 'add-liquidity-thala',
  description: 'Add liquidity to a pool on Thala protocol',
  inputSchema: z.object({
    mintXAmount: z.number().positive().describe('Amount of X tokens to add'),
    mintYAmount: z.number().positive().describe('Amount of Y tokens to add'),
    mintX: z.string().describe('X token mint type'),
    mintY: z.string().describe('Y token mint type'),
    network: z.enum(['MAINNET', 'TESTNET', 'DEVNET']).default('MAINNET').describe('The Aptos network to use'),
  }),
  outputSchema: z.object({
    transactionHash: z.string(),
  }),
  execute: async ({ context }) => {
    const { agentRuntime } = await createAgentRuntime(context.network as 'MAINNET' | 'TESTNET' | 'DEVNET');
    const transactionHash = await agentRuntime.addLiquidityWithThala(
      context.mintX as MoveStructId,
      context.mintY as MoveStructId,
      context.mintXAmount,
      context.mintYAmount
    );
    return { transactionHash };
  },
});

// Tool for removing liquidity from Thala
export const removeLiquidityThalaTokensTool = createTool({
  id: 'remove-liquidity-thala',
  description: 'Remove liquidity from a pool on Thala protocol',
  inputSchema: z.object({
    lpAmount: z.number().positive().describe('Amount of LP tokens to remove'),
    mintX: z.string().describe('X token mint type'),
    mintY: z.string().describe('Y token mint type'),
    network: z.enum(['MAINNET', 'TESTNET', 'DEVNET']).default('MAINNET').describe('The Aptos network to use'),
  }),
  outputSchema: z.object({
    transactionHash: z.string(),
  }),
  execute: async ({ context }) => {
    const { agentRuntime } = await createAgentRuntime(context.network as 'MAINNET' | 'TESTNET' | 'DEVNET');
    const transactionHash = await agentRuntime.removeLiquidityWithThala(
      context.mintX as MoveStructId,
      context.mintY as MoveStructId,
      context.lpAmount
    );
    return { transactionHash };
  },
});

// Tool for creating a pool with Thala
export const createPoolThalaTokensTool = createTool({
  id: 'create-pool-thala',
  description: 'Create a new liquidity pool on Thala protocol',
  inputSchema: z.object({
    mintX: z.string().describe('X token mint type'),
    mintY: z.string().describe('Y token mint type'),
    amountX: z.number().positive().describe('Initial amount of X tokens'),
    amountY: z.number().positive().describe('Initial amount of Y tokens'),
    feeTier: z.number().int().min(0).max(10000).describe('Fee tier in basis points (0-10000)'),
    amplificationFactor: z.number().int().positive().describe('Amplification factor for the pool'),
    network: z.enum(['MAINNET', 'TESTNET', 'DEVNET']).default('MAINNET').describe('The Aptos network to use'),
  }),
  outputSchema: z.object({
    transactionHash: z.string(),
  }),
  execute: async ({ context }) => {
    const { agentRuntime } = await createAgentRuntime(context.network as 'MAINNET' | 'TESTNET' | 'DEVNET');
    const transactionHash = await agentRuntime.createPoolWithThala(
      context.mintX,
      context.mintY,
      context.amountX,
      context.amountY,
      context.feeTier,
      context.amplificationFactor
    );
    return { transactionHash };
  },
});
