import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getScraper } from "../../lib/twitter/auth";
import { getProtocolTweets, getTweetsFromAccount, searchTweets } from "../../lib/twitter/index";
import type { Scraper } from "../../lib/twitter/types";

// Keep a single scraper instance for better performance and to avoid login throttling
let scraperInstance: Scraper | null = null;

/**
 * Get an authenticated Twitter scraper, using the cached instance if available
 */
async function getTwitterScraper(): Promise<Scraper> {
  if (!scraperInstance) {
    // Use type assertion to tell TypeScript this is safe
    scraperInstance = await getScraper() as unknown as Scraper;
  }
  return scraperInstance;
}

/**
 * Tool for fetching tweets from a specific Twitter account
 */
export const accountTweetsTool = createTool({
  id: 'get-account-tweets',
  description: 'Get tweets from a specific Twitter account',
  inputSchema: z.object({
    username: z.string().describe('Twitter username (with or without @ symbol)'),
    limit: z.number().default(5).describe('Maximum number of tweets to retrieve'),
  }),
  outputSchema: z.object({
    tweets: z.array(
      z.object({
        id: z.string().optional(),
        text: z.string().optional(),
        username: z.string().optional(),
        timeParsed: z.string().optional(),
        likes: z.number().optional(),
        retweets: z.number().optional(),
        replies: z.number().optional(),
        isVerified: z.boolean().optional(),
      })
    ),
  }),
  execute: async ({ context }) => {
    const { username, limit } = context;
    
    // Get the scraper first
    const scraper = await getTwitterScraper();
    
    // Get tweets from the specified account
    const tweets = await getTweetsFromAccount(username, limit, scraper);
    
    // Map tweets to a simpler format for the tool response
    return {
      tweets: tweets.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        username: tweet.username,
        timeParsed: typeof tweet.timeParsed === 'object' ? tweet.timeParsed.toISOString() : tweet.timeParsed,
        likes: tweet.likes,
        retweets: tweet.retweets,
        replies: tweet.replies,
        isVerified: tweet.isVerified
      }))
    };
  }
});

/**
 * Tool for searching tweets based on a query
 */
export const searchTwitterTool = createTool({
  id: 'search-tweets',
  description: 'Search for tweets matching a query',
  inputSchema: z.object({
    query: z.string().describe('Search query'),
    limit: z.number().default(5).describe('Maximum number of tweets to retrieve'),
    includeReplies: z.boolean().default(false).describe('Whether to include replies in search results'),
  }),
  outputSchema: z.object({
    tweets: z.array(
      z.object({
        id: z.string().optional(),
        text: z.string().optional(),
        username: z.string().optional(),
        timeParsed: z.string().optional(),
        likes: z.number().optional(),
        retweets: z.number().optional(),
        replies: z.number().optional(),
        isVerified: z.boolean().optional(),
      })
    ),
  }),
  execute: async ({ context }) => {
    const { query, limit, includeReplies } = context;
    
    // Get the scraper first
    const scraper = await getTwitterScraper();
    
    // Search for tweets matching the query
    const tweets = await searchTweets(query, { limit, includeReplies }, scraper);
    
    // Map tweets to a simpler format for the tool response
    return {
      tweets: tweets.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        username: tweet.username,
        timeParsed: typeof tweet.timeParsed === 'object' ? tweet.timeParsed.toISOString() : tweet.timeParsed,
        likes: tweet.likes,
        retweets: tweet.retweets,
        replies: tweet.replies,
        isVerified: tweet.isVerified
      }))
    };
  }
});

/**
 * Tool for getting tweets related to blockchain protocols
 */
export const protocolTweetsTool = createTool({
  id: 'get-protocol-tweets',
  description: 'Get tweets related to blockchain protocols',
  inputSchema: z.object({
    protocols: z.array(z.string()).describe('Array of protocol names'),
    tweetsPerProtocol: z.number().default(3).describe('Number of tweets to fetch per protocol'),
  }),
  outputSchema: z.object({
    results: z.record(
      z.array(
        z.object({
          id: z.string().optional(),
          text: z.string().optional(),
          username: z.string().optional(),
          timeParsed: z.string().optional(),
          likes: z.number().optional(),
          retweets: z.number().optional(),
          replies: z.number().optional(),
          isVerified: z.boolean().optional(),
          protocol: z.string(),
          relevanceScore: z.number(),
        })
      )
    ),
  }),
  execute: async ({ context }) => {
    const { protocols, tweetsPerProtocol } = context;
    
    // Get the scraper first
    const scraper = await getTwitterScraper();
    
    // Get tweets for the protocols
    const protocolResults = await getProtocolTweets(protocols, tweetsPerProtocol, scraper);
    
    // Map results to a simpler format for the tool response
    const formattedResults: Record<string, Array<{
      id?: string;
      text?: string;
      username?: string;
      timeParsed?: string;
      likes?: number;
      retweets?: number;
      replies?: number;
      isVerified?: boolean;
      protocol: string;
      relevanceScore: number;
    }>> = {};
    
    for (const [protocol, tweets] of Object.entries(protocolResults)) {
      formattedResults[protocol] = tweets.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        username: tweet.username,
        timeParsed: typeof tweet.timeParsed === 'object' ? tweet.timeParsed.toISOString() : tweet.timeParsed,
        likes: tweet.likes,
        retweets: tweet.retweets,
        replies: tweet.replies,
        isVerified: tweet.isVerified,
        protocol: tweet.protocol,
        relevanceScore: tweet.relevanceScore
      }));
    }
    
    return { results: formattedResults };
  }
});

// Group all Twitter tools for export
export const twitterTools = [
  accountTweetsTool,
  searchTwitterTool,
  protocolTweetsTool
];
