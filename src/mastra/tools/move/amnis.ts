import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import {
    Aptos,
    AptosConfig,
    Ed25519PrivateKey,
    type HexInput,
    Network,
    PrivateKey,
    PrivateKeyVariants,
    AccountAddress,
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

// Tool for staking tokens with Amnis
export const stakeAmnisTokensTool = createTool({
  id: 'stake-amnis-tokens',
  description: 'Stake tokens with Amnis protocol',
  inputSchema: z.object({
    amount: z.number().positive().describe('Amount of tokens to stake'),
    to: z.string().optional().describe('Optional target address for staking'),
    network: z.enum(['MAINNET', 'TESTNET', 'DEVNET']).default('MAINNET').describe('The Aptos network to use'),
  }),
  outputSchema: z.object({
    transactionHash: z.string(),
  }),
  execute: async ({ context }) => {
    const { agentRuntime, account } = await createAgentRuntime(context.network as 'MAINNET' | 'TESTNET' | 'DEVNET');
    
    // Use provided address or default to current wallet
    const toAddress = context.to 
      ? AccountAddress.fromString(context.to) 
      : account.accountAddress;
    
    const transactionHash = await agentRuntime.stakeTokensWithAmnis(toAddress, context.amount);
    
    return { transactionHash };
  },
});

// Tool for withdrawing staked tokens from Amnis
export const withdrawAmnisTokensTool = createTool({
  id: 'withdraw-amnis-tokens',
  description: 'Withdraw staked tokens from Amnis protocol',
  inputSchema: z.object({
    amount: z.number().positive().describe('Amount of tokens to withdraw'),
    to: z.string().optional().describe('Optional target address for withdrawal'),
    network: z.enum(['MAINNET', 'TESTNET', 'DEVNET']).default('MAINNET').describe('The Aptos network to use'),
  }),
  outputSchema: z.object({
    transactionHash: z.string(),
  }),
  execute: async ({ context }) => {
    const { agentRuntime, account } = await createAgentRuntime(context.network as 'MAINNET' | 'TESTNET' | 'DEVNET');
    
    // Use provided address or default to current wallet
    const toAddress = context.to 
      ? AccountAddress.fromString(context.to) 
      : account.accountAddress;
    
    const transactionHash = await agentRuntime.withdrawStakeFromAmnis(toAddress, context.amount);
    
    return { transactionHash };
  },
});
