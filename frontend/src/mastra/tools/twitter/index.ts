import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { getScraper } from "../../../lib/twitter/auth";
import { getProtocolTweets, getTweetsFromAccount, searchTweets } from "../../../lib/twitter/index";
import type { Scraper } from "../../../lib/twitter/types";

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

/**
 * Tool for analyzing Twitter activity related to blockchain protocols
 */
export const twitterAnalysisTool = createTool({
  id: 'twitter-analysis',
  description: 'Analyze Twitter activity for blockchain protocols and topics with relevance scoring',
  inputSchema: z.object({}),
  outputSchema: z.object({
    results: z.record(
      z.array(
        z.object({
          id: z.string().optional(),
          username: z.string().optional(),
          text: z.string().optional(),
          timeParsed: z.string().optional(),
          likes: z.number().optional(),
          retweets: z.number().optional(),
          protocol: z.string(),
          relevanceScore: z.number(),
          snippet: z.string().describe('Short text snippet for easy display'),
        })
      )
    ),
    topTweets: z.array(
      z.object({
        protocol: z.string(),
        username: z.string().optional(),
        relevanceScore: z.number(),
        snippet: z.string(),
      })
    ).describe('List of tweets with highest relevance scores across all protocols'),
    summary: z.object({
      mostActive: z.string().describe('Protocol with most relevant tweet activity'),
      averageScores: z.record(z.number()).describe('Average relevance scores by protocol'),
    }),
  }),
  execute: async ({ context }) => {
    // Fixed protocols list
    const protocols: string[] = ['PontemNetwork', 'ThalaLabs', 'JouleFinance', 'AmnisFinance'];
    // Hard coded parameters
    const tweetsPerProtocol = 3;
    const includeReplies = false;
    const minLikes = undefined;
    const includeAccounts: string[] = [];
    
    // Get the scraper first
    const scraper = await getTwitterScraper();
    
    // Define tweet result type
    interface AnalysisTweet {
      id?: string;
      username?: string;
      text?: string;
      timeParsed?: string;
      likes?: number;
      retweets?: number;
      protocol: string;
      relevanceScore: number;
      snippet: string;
    }
    
    // Process protocol tweets
    const allProtocolResults: Record<string, AnalysisTweet[]> = {};
    const allTweets: AnalysisTweet[] = [];
    const protocolScores: Record<string, number[]> = {};
    
    try {
      // Get protocol tweets and maybe add account-specific tweets
      const protocolsToFetch = [...protocols];
      
      // If accounts are specified, add them as search items too
      if (includeAccounts && includeAccounts.length > 0) {
        for (const account of includeAccounts) {
          try {
            const accountTweets = await getTweetsFromAccount(account, tweetsPerProtocol, scraper);
            
            // Associate these tweets with the most relevant protocol
            for (const tweet of accountTweets) {
              // Find most relevant protocol for this tweet
              let bestProtocol = protocols[0];
              let bestScore = 0;
              
              for (const protocol of protocols) {
                // Simple relevance calculation - how many times the protocol is mentioned
                const protocolRegex = new RegExp(protocol, 'gi');
                const matches = (tweet.text || '').match(protocolRegex) || [];
                const score = matches.length;
                
                if (score > bestScore) {
                  bestScore = score;
                  bestProtocol = protocol;
                }
              }
              
              // Only include tweets that mention at least one protocol
              if (bestScore > 0) {
                // Filter by likes if specified
                if (minLikes !== undefined && (tweet.likes || 0) < minLikes) {
                  continue;
                }
                
                // Create analysis tweet object
                const text = tweet.text || '';
                const analysisTweet: AnalysisTweet = {
                  id: tweet.id,
                  username: tweet.username,
                  text: tweet.text,
                  timeParsed: typeof tweet.timeParsed === 'object' ? tweet.timeParsed.toISOString() : tweet.timeParsed,
                  likes: tweet.likes,
                  retweets: tweet.retweets,
                  protocol: bestProtocol,
                  relevanceScore: bestScore,
                  snippet: `${text.substring(0, 80)}${text.length > 80 ? '...' : ''}`
                };
                
                // Add to results
                if (!allProtocolResults[bestProtocol]) {
                  allProtocolResults[bestProtocol] = [];
                }
                
                allProtocolResults[bestProtocol].push(analysisTweet);
                allTweets.push(analysisTweet);
                
                // Track scores for average calculation
                if (!protocolScores[bestProtocol]) {
                  protocolScores[bestProtocol] = [];
                }
                protocolScores[bestProtocol].push(bestScore);
              }
            }
          } catch (error) {
            console.error(`Error fetching tweets from account ${account}:`, error);
          }
        }
      }
      
      // Get the main protocol tweets
      const protocolResults = await getProtocolTweets(protocolsToFetch, tweetsPerProtocol, scraper);
      
      // Process the results
      for (const [protocol, tweets] of Object.entries(protocolResults)) {
        // Filter by likes if needed
        const filteredTweets = minLikes !== undefined ? 
          tweets.filter(tweet => (tweet.likes || 0) >= minLikes) : tweets;
        
        // Format results
        const analysisTweets = filteredTweets.map(tweet => {
          const text = tweet.text || '';
          const analysisTweet: AnalysisTweet = {
            id: tweet.id,
            username: tweet.username,
            text: tweet.text,
            timeParsed: typeof tweet.timeParsed === 'object' ? tweet.timeParsed.toISOString() : tweet.timeParsed,
            likes: tweet.likes,
            retweets: tweet.retweets,
            protocol: tweet.protocol,
            relevanceScore: tweet.relevanceScore,
            snippet: `${text.substring(0, 80)}${text.length > 80 ? '...' : ''}`
          };
          
          // Track scores for average calculation
          if (!protocolScores[protocol]) {
            protocolScores[protocol] = [];
          }
          protocolScores[protocol].push(tweet.relevanceScore);
          
          return analysisTweet;
        });
        
        // Add to results
        if (!allProtocolResults[protocol]) {
          allProtocolResults[protocol] = [];
        }
        
        allProtocolResults[protocol] = [
          ...allProtocolResults[protocol],
          ...analysisTweets
        ];
        
        // Add to all tweets array
        allTweets.push(...analysisTweets);
      }
      
      // Get top tweets by relevance score
      const topTweets = [...allTweets]
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5)
        .map(tweet => ({
          protocol: tweet.protocol,
          username: tweet.username,
          relevanceScore: tweet.relevanceScore,
          snippet: tweet.snippet
        }));
      
      // Calculate average scores by protocol
      const averageScores: Record<string, number> = {};
      for (const [protocol, scores] of Object.entries(protocolScores)) {
        if (scores.length > 0) {
          const sum = scores.reduce((acc, score) => acc + score, 0);
          averageScores[protocol] = Number.parseFloat((sum / scores.length).toFixed(2));
        } else {
          averageScores[protocol] = 0;
        }
      }
      
      // Determine most active protocol
      let mostActive = protocols[0];
      let highestAvg = 0;
      
      for (const [protocol, avg] of Object.entries(averageScores)) {
        if (avg > highestAvg) {
          highestAvg = avg;
          mostActive = protocol;
        }
      }
      
      // Return formatted results
      return {
        results: allProtocolResults,
        topTweets,
        summary: {
          mostActive,
          averageScores
        }
      };
      
    } catch (error) {
      console.error('Error analyzing tweets for protocols: %s', error);
      
      // Return empty results in case of error
      return {
        results: {},
        topTweets: [],
        summary: {
          mostActive: '',
          averageScores: {}
        }
      };
    }
  }
});

// Group all Twitter tools for export
export const twitterTools = [
  accountTweetsTool,
  searchTwitterTool,
  protocolTweetsTool,
  twitterAnalysisTool
];
