import { db } from '@/lib/db/drizzle';
import { boosts } from '@/lib/db/schema';
import { getWalletBalance } from '@/lib/move';
import { groq } from '@ai-sdk/groq';
import { createTool } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import { Step, Workflow } from '@mastra/core/workflows';
import { eq } from 'drizzle-orm';
import { parseUnits } from 'viem';
import { z } from 'zod';
import { getAllProtocolsTool } from '../tools/db';

const llm = groq('qwen-qwq-32b');

export const formatAmountTool = createTool({
  id: 'format-amount',
  description: 'Format Amount to 8 digits',
  inputSchema: z.object({
    amount: z.number().describe('The amount to format')
  }),
  outputSchema: z.object({
    formattedAmount: z.string(),
  }),
  execute: async ({ context }) => {
    return {
      formattedAmount: parseUnits(String(context.amount), 8).toString()
    }
  },
});

// Tool for checking a wallet's balance
export const convertTokenNameToAddressTool = createTool({
  id: 'convert-token-name-to-address',
  description: 'Convert token name to token address',
  inputSchema: z.object({
    tokenName: z.string().describe('The token name')
  }),
  outputSchema: z.object({
    tokenAddress: z.string(),
  }),
  execute: async ({ context }) => {

    if (context.tokenName === 'APT') {
      return {
        tokenAddress: '0x1::aptos_coin::AptosCoin'
      }
    }
    return {
      tokenAddress: context.tokenName
    }
  },
});


const agent = new Agent({
  name: 'Amount Converter Agent',
  model: llm,
  tools: {
    formatAmountTool,
    convertTokenNameToAddressTool,
  },
  instructions: `Convert natural language request to protocol input friendly format. 
  Given any string you will use your tools to convert it to a valid protocol input.

  INPUT:
  withdraw 0.01 of APT from joule for position 1

  OUTPUT:
  withdraw 1000000 of 0x1::aptos_coin::AptosCoin from joule for position 1
  `
});

/**
 * Step 1: Parse the transaction request
 * This step extracts relevant information from the user's request string
 */
const parseTransactionRequest = new Step({
  id: 'parse-transaction-request',
  description: 'Parse a transaction request string and extract relevant information',
  inputSchema: z.object({
    requestString: z.string().describe('The user\'s transaction request string')
  }),
  execute: async ({ context }) => {
    const requestString = context.triggerData.requestString;
    console.log(`Parsing transaction request: ${requestString}`);
    const response = await agent.generate(requestString);
    console.log(`Parsed: ${response.text}`);
    return {
      formattedRequest: response.text,
    };
  }
});

/**
 * Step 2: Award points based on protocol multiplier
 * This step fetches the protocol multiplier and awards points to the user
 */
const awardPoints = new Step({
  id: 'award-points',
  description: 'Award points to the user based on the protocol multiplier',
  inputSchema: z.object({
    action: z.string(),
    amount: z.number(),
    token: z.string(),
    protocol: z.string(),
    positionId: z.string()
  }),
  execute: async ({ context, mastra }) => {
    const parsed = context.inputData;
    const protocol = parsed.protocol;
    console.log(`Awarding points for transaction with ${protocol}`);

    // 1. Get the user's wallet address
    const { address } = await getWalletBalance();
    console.log(`User address: ${address}`);

    // 2. Get the protocol multiplier
    let multiplier = 1.0;

    // Get the protocol information using getAllProtocolsTool
    if (protocol && mastra) {
      try {
        // Use the tool directly
        if (getAllProtocolsTool) {
          const protocolsResult = await getAllProtocolsTool.execute({});

          if (protocolsResult?.protocols) {
            const protocolData = protocolsResult.protocols.find(
              (p: { protocol: string; multiplier: string }) =>
                p.protocol.toLowerCase() === protocol.toLowerCase()
            );

            if (protocolData?.multiplier) {
              multiplier = Number.parseFloat(protocolData.multiplier);
              console.log(`Found multiplier for ${protocol}: ${multiplier}`);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching protocol data:', error);

        // Fallback: directly query the database
        const boostData = await db
          .select()
          .from(boosts)
          .where(eq(boosts.protocol, protocol));

        if (boostData.length > 0 && boostData[0].multiplier) {
          multiplier = Number.parseFloat(boostData[0].multiplier);
          console.log(`Found multiplier from DB for ${protocol}: ${multiplier}`);
        }
      }
    }

    // 3. Calculate points to award (base 20 points * multiplier)
    const basePoints = 20;
    const pointsToAward = Math.round(basePoints * multiplier);
    console.log(`Awarding ${pointsToAward} points (${basePoints} × ${multiplier})`);

    // 4. Update the user's points using upsertUserTool
    if (mastra) {
      try {
        // Get and execute the tool directly
        const upsertUserTool = mastra.getTool('upsertUserTool');
        if (upsertUserTool) {
          const result = await upsertUserTool.execute({
            address,
            points: pointsToAward
          });

          return {
            success: true,
            address,
            pointsAwarded: pointsToAward,
            multiplier,
            protocol,
            userResult: result
          };
        }
        throw new Error('upsertUserTool not found');
      } catch (error) {
        console.error('Error updating user points:', error);
        throw new Error(`Failed to award points: ${error}`);
      }
    } else {
      throw new Error('Mastra instance is required but not available');
    }
  }
});

/**
 * The transaction rewards workflow
 * This workflow parses a user's transaction request and awards points
 */
const transactionRewardsWorkflow = new Workflow({
  name: 'transaction-rewards-workflow',
  triggerSchema: z.object({
    requestString: z.string().describe('The user\'s transaction request string')
  }),
})
  .step(parseTransactionRequest)
// .then(awardPoints);

// Commit the workflow
transactionRewardsWorkflow.commit();

export { transactionRewardsWorkflow };
