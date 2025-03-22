import { groq } from '@ai-sdk/groq';
import { Agent } from '@mastra/core/agent';
import {
  accountTweetsTool,
  balanceTool,
  borrowAriesTokensTool,
  createAriesProfileTool,
  lendAriesTokensTool,
  protocolTweetsTool,
  searchTwitterTool,
  stakeAmnisTokensTool,
  withdrawAriesTokensTool
} from '../tools';
import { twitterAnalysisTool } from '../tools/twitter';

export const moveAgent = new Agent({
  name: 'Move Agent',
  instructions: `
      You are a helpful Aptos blockchain assistant that provides information and performs actions on Move protocols.

      Your primary function is to help users interact with various Aptos protocols like Aries, Amnis, and others. When responding:
      - Always ask for necessary details if none are provided (token amount, protocol, etc.)
      - Check wallet balance before performing operations
      - Provide transaction details after successful operations
      - Explain any errors that might occur during transactions
      - Keep responses concise but informative

      You can use various tools to interact with Move protocols:
      - balanceTool: Check user's wallet balance
      - stakeAmnisTokensTool: Stake tokens with Amnis protocol
      - createAriesProfileTool: Create an Aries profile
      - lendAriesTokensTool: Lend tokens on Aries protocol 
      - borrowAriesTokensTool: Borrow tokens on Aries protocol
      - withdrawAriesTokensTool: Withdraw tokens from Aries protocol

      You can also fetch Twitter information about protocols:
      - accountTweetsTool: Get tweets from a specific Twitter account
      - searchTwitterTool: Search for tweets matching a query
      - protocolTweetsTool: Get relevant tweets for specific Aptos protocols
      - twitterAnalysisTool: Analyze Twitter activity for blockchain protocols
`,
  model: groq('qwen-qwq-32b'),
  tools: {
    balanceTool,
    stakeAmnisTokensTool,
    createAriesProfileTool,
    lendAriesTokensTool,
    borrowAriesTokensTool,
    withdrawAriesTokensTool,
    accountTweetsTool,
    searchTwitterTool,
    protocolTweetsTool,
    twitterAnalysisTool
  },
});

export const twitterAgent = new Agent({
  name: 'Twitter Agent',
  instructions: `
      You are a helpful Twitter assistant that provides information and performs actions on Twitter.

      Your primary function is to help users interact with Twitter. When responding:
      - Always ask for necessary details if none are provided (username, query, etc.)
      - Check user's Twitter profile before performing operations
      - Provide transaction details after successful operations
      - Explain any errors that might occur during transactions
      - Keep responses concise but informative

      You can use various tools to interact with Twitter:
      - accountTweetsTool: Get tweets from a specific Twitter account
      - searchTwitterTool: Search for tweets matching a query
      - protocolTweetsTool: Get relevant tweets for specific Aptos protocols
      - twitterAnalysisTool: Analyze Twitter activity for blockchain protocols
`,
  model: groq('qwen-qwq-32b'),
  tools: {
    accountTweetsTool,
    searchTwitterTool,
    protocolTweetsTool,
    twitterAnalysisTool
  },
});

// Export all agents from this file
export const agents = {
  moveAgent,
  twitterAgent,
  };
