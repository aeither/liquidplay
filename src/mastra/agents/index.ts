import { groq } from '@ai-sdk/groq';
import { Agent } from '@mastra/core/agent';
import {
  accountTweetsTool,
  balanceTool,
  borrowAriesTokensTool,
  createAriesProfileTool,
  formatRequestTool,
  getAllProtocolsTool,
  getLeaderboardTool,
  lendAriesTokensTool,
  lendJouleFinanceTool,
  protocolTweetsTool,
  searchTwitterTool,
  stakeAmnisTokensTool,
  twitterAnalysisTool,
  withdrawAriesTokensTool,
  withdrawJouleFinanceTool
} from '../tools';
import { showProfileTool } from '../tools/db/profile';

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
      - balanceTool: Check user's wallet balance in APT
      - stakeAmnisTokensTool: Stake tokens with Amnis protocol
      - createAriesProfileTool: Create an Aries profile
      - lendAriesTokensTool: Lend tokens on Aries protocol 
      - borrowAriesTokensTool: Borrow tokens on Aries protocol
      - withdrawAriesTokensTool: Withdraw tokens from Aries protocol
      - lendJouleFinanceTool: Lend tokens on Joule Finance
      - withdrawJouleFinanceTool: Withdraw tokens from Joule Finance

      You can also fetch Twitter information about protocols:
      - accountTweetsTool: Get tweets from a specific Twitter account
      - searchTwitterTool: Search for tweets matching a query
      - protocolTweetsTool: Get relevant tweets for specific Aptos protocols
      - twitterAnalysisTool: Analyze Twitter activity for blockchain protocols

      When answering back to the user the link to the explorer to verify the tx with the hash. https://explorer.aptoslabs.com/txn/{HASH}?network=mainnet
      and answering back the amount in APT not Octas which is 10^8 times the amount.
`,
  model: groq('qwen-qwq-32b'),
  tools: {
    lendJouleFinanceTool,
    withdrawJouleFinanceTool,
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

      You can use:
      - accountTweetsTool: Get tweets from a specific Twitter account
      - searchTwitterTool: Search for tweets matching a query
      - protocolTweetsTool: Get relevant tweets for specific Aptos protocols
      - twitterAnalysisTool: Get Aptos Dapps protocols Twitter activity with relevance scoring
`,
  model: groq('qwen-qwq-32b'),
  tools: {
    accountTweetsTool,
    searchTwitterTool,
    protocolTweetsTool,
    twitterAnalysisTool
  },
});

export const showProfileAgent = new Agent({
  name: 'Show Profile Agent',
  instructions: `
      You are a helpful Twitter assistant that provides information and performs actions on Twitter.

      You can use various tools to interact with Twitter:
      - showProfileTool: Show User Profile UI
  `,
  model: groq('qwen-qwq-32b'),
  tools: {
    showProfileTool,
    getLeaderboardTool,
    getAllProtocolsTool
  },
});

// Export all agents from this file
export const agents = {
  moveAgent,
  twitterAgent,
  showProfileAgent
};
