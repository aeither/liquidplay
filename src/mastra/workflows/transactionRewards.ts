import { getWalletBalance } from '@/lib/move';
import { groq } from '@ai-sdk/groq';
import { createTool } from '@mastra/core';
import { Agent } from '@mastra/core/agent';
import { Step, Workflow } from '@mastra/core/workflows';
import { parseUnits } from 'viem';
import { z } from 'zod';
import { getAllProtocolsTool, upsertUserTool } from '../tools/db';

const llm = groq('qwen-qwq-32b');

const formatAmountTool = createTool({
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
const convertTokenNameToAddressTool = createTool({
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

const converterAgent = new Agent({
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
    const response = await converterAgent.generate(requestString);
    console.log(`Parsed: ${response.text}`);
    return {
      formattedRequest: response.text,
    };
  }
});



/**
 * Agent and Tools for Step 2
 */
const getAmountWithMultiplierTool = createTool({
  id: 'format-amount',
  description: 'Format Amount to 8 digits',
  inputSchema: z.object({
    multiplier: z.number().describe('The amount to multiply to')
  }),
  outputSchema: z.object({
    amount: z.number(),
  }),
  execute: async ({ context }) => {
    const basePoint = 5
    return {
      amount: context.multiplier * basePoint,
    }
  },
});

const addPointsAgent = new Agent({
  name: 'Add Point Agent',
  model: llm,
  tools: {
    getAllProtocolsTool,
    getAmountWithMultiplierTool,
    upsertUserTool,
  },
  instructions: `
Use Tools to add points to user according to multiplier

use getAllProtocolsTool to get list of protocols with its multipliers

deduce the multiplier by matching from user message mentioned protocol to the list of protocols with multiplier
use getAmountWithMultiplierTool to calculate the amount to give to the user

use upsertUserTool to update the database with the amount we got from getAmountWithMultiplierTool

answer back with the user address with the final points
  `
});

/**
 * Step 2: Award points based on protocol multiplier
 * This step fetches the protocol multiplier and awards points to the user
 */
const awardPoints = new Step({
  id: 'award-points',
  description: 'Award points to the user based on the protocol multiplier',
  inputSchema: z.object({
    requestString: z.string().describe('The user\'s transaction request string')
  }),
  execute: async ({ context }) => {
    const requestString = context.triggerData.requestString;
    const { address } = await getWalletBalance();
    const response = await addPointsAgent.generate(`${requestString}. User address: ${address}`);
    console.log(`Awarded points: ${response.text}`);
    return {
      formattedRequest: response.text,
    };
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
