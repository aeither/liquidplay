// Import from local types file and auth module
import { getScraper } from './auth';
import type { GetTweetsOptions, Scraper, Tweet, TweetSearchOptions } from './types';

// Export interfaces for use by tools
export interface ProtocolTweet extends Tweet {
  protocol: string;
  relevanceScore: number;
}

/**
 * Get tweets from a specific Twitter account
 * @param username Twitter username without the @ symbol
 * @param limit Maximum number of tweets to retrieve
 * @param scraper Optional authenticated scraper instance
 * @returns Array of tweets
 */
export async function getTweetsFromAccount(
  username: string,
  limit: number,
  scraper?: Scraper
): Promise<Tweet[]> {
  // Create a scraper if one wasn't provided
  const twitterScraper = scraper || await getScraper();
  
  try {
    // Remove @ if it was included in the username
    const cleanUsername = username.replace(/^@/, '');
    
    // Pass limit as a GetTweetsOptions object to avoid type issues
    const options: GetTweetsOptions = { limit };
    // @ts-ignore - We need to ignore type mismatch here as we're adapting two different interfaces
    const tweetGenerator = await twitterScraper.getTweets(cleanUsername, options);
    
    // Handle generator to array conversion
    const tweets: Tweet[] = [];
    let count = 0;
    
    for await (const tweet of tweetGenerator) {
      tweets.push(tweet as unknown as Tweet);
      count++;
      
      if (count >= limit) {
        break;
      }
    }
    
    return tweets;
  } catch (error) {
    console.error(`Error getting tweets from @${username}:`, error);
    return [];
  }
}

/**
 * Interface for search options
 */
interface SearchOptions {
  limit: number;
  includeReplies?: boolean;
}

/**
 * Search for tweets matching a query
 * @param query Search query
 * @param options Search options (limit, includeReplies)
 * @param scraper Optional authenticated scraper instance
 * @returns Array of matching tweets
 */
export async function searchTweets(
  query: string,
  options: SearchOptions = { limit: 10 },
  scraper?: Scraper
): Promise<Tweet[]> {
  // Create a scraper if one wasn't provided
  const twitterScraper = scraper || await getScraper();
  const { limit, includeReplies = false } = options;
  
  try {
    // Here we need to handle the fact that the library may have different method signatures
    // than our interface
    try {
      // Try using the search method if it exists
      if ('search' in twitterScraper) {
        // @ts-ignore - We need to ignore type mismatch here as we're adapting two different interfaces
        const tweetGenerator = await twitterScraper.search(query, { includeReplies });
        
        // Handle generator to array conversion
        const tweets: Tweet[] = [];
        let count = 0;
        
        for await (const tweet of tweetGenerator) {
          tweets.push(tweet as unknown as Tweet);
          count++;
          
          if (count >= limit) {
            break;
          }
        }
        
        return tweets;
      }
      
      throw new Error('Search method not available');
    } catch (methodError) {
      // Fallback to getTweets if search doesn't exist
      console.log('Search method not available, falling back to getTweets');
      const options: GetTweetsOptions = { limit };
      // @ts-ignore - We need to ignore type mismatch here as we're adapting two different interfaces
      const tweetGenerator = await twitterScraper.getTweets(query, options);
      
      // Handle generator to array conversion
      const tweets: Tweet[] = [];
      let count = 0;
      
      for await (const tweet of tweetGenerator) {
        tweets.push(tweet as unknown as Tweet);
        count++;
        
        if (count >= limit) {
          break;
        }
      }
      
      return tweets;
    }
  } catch (error) {
    console.error(`Error searching for "${query}":`, error);
    return [];
  }
}

/**
 * Search Twitter for specific query
 * @param query Search query
 * @param limit Maximum number of tweets to fetch
 * @param includeReplies Whether to include replies in search results
 * @param scraper An authenticated Twitter scraper
 * @returns Array of tweets
 */
export async function searchTwitter(
  query: string,
  limit = 20,
  includeReplies = false,
  scraper?: Scraper
): Promise<Tweet[]> {
  // Create a scraper if one wasn't provided
  const twitterScraper = scraper || await getScraper();
  
  try {
    // Handle format issues with the query, e.g., convert hashtags or mentions
    const cleanQuery = query.trim();
    
    // Twitter client API types don't always match what we need
    // The search method may not exist in the client library implementation
    try {
      // Try using the search method if it exists
      // @ts-ignore - We need to ignore property check because search is optional
      if ('search' in twitterScraper) {
        // @ts-ignore - We need to ignore type mismatch here as we're adapting two different interfaces
        const tweetGenerator = await twitterScraper.search(query, { includeReplies });
        
        // Handle generator to array conversion
        const tweets: Tweet[] = [];
        let count = 0;
        
        for await (const tweet of tweetGenerator) {
          // Add isVerified property if missing
          const rawTweet = tweet as Partial<Tweet>;
          const processedTweet: Tweet = {
            ...rawTweet as Tweet,
            isVerified: rawTweet.isVerified ?? false
          };
          tweets.push(processedTweet);
          count++;
          
          if (count >= limit) {
            break;
          }
        }
        
        return tweets;
      }
      
      throw new Error('Search method not available');
    } catch (error) {
      // Fallback to getTweets if search doesn't exist
      console.log('Search method not available, falling back to getTweets');
      // @ts-ignore - We need to ignore type mismatch here as we're adapting two different interfaces
      const tweetGenerator = await twitterScraper.getTweets(query, limit);
      
      const tweets: Tweet[] = [];
      let count = 0;
      
      for await (const tweet of tweetGenerator) {
        // Add isVerified property if missing
        const rawTweet = tweet as Partial<Tweet>;
        const processedTweet: Tweet = {
          ...rawTweet as Tweet,
          isVerified: rawTweet.isVerified ?? false
        };
        tweets.push(processedTweet);
        count++;
        
        if (count >= limit) {
          break;
        }
      }
      
      return tweets;
    }
  } catch (error) {
    console.error(`Error searching Twitter for ${query}:`, error);
    return [];
  }
}

/**
 * Calculate relevance score for a tweet relative to a protocol
 * Simple scoring based on occurrences and other factors
 */
function calculateRelevanceScore(tweet: Tweet, protocol: string): number {
  const text = tweet.text?.toLowerCase() || '';
  const protocol_lc = protocol.toLowerCase();
  
  // Basic factors for scoring
  let score = 0;
  
  // Protocol mentions in text (weighted highest)
  const protocolMentions = (text.match(new RegExp(protocol_lc, 'gi')) || []).length;
  score += protocolMentions * 3;
  
  // Handle edge case where protocol isn't mentioned but tweet might still be relevant
  if (protocolMentions === 0) {
    // Look for related terms based on protocol
    const relatedTerms: Record<string, string[]> = {
      'joule': ['lending', 'borrow', 'jlp', 'liquidity', 'yield', 'pool', 'finance', 'apy', 'aptos'],
      'thala': ['dex', 'swap', 'thl', 'mov', 'mod', 'stablecoin', 'liquidity', 'pool', 'aptos'],
      'liquidswap': ['dex', 'swap', 'liquidity', 'trading', 'lp', 'pool', 'aptos'],
      'tortuga': ['staking', 'stake', 'liquid staking', 'tus', 'aptos'],
      'amnis': ['staking', 'stake', 'yield', 'aptos'],
      'aries': ['lending', 'borrow', 'apy', 'markets', 'collateral', 'aptos'],
      'aptin': ['dex', 'swap', 'perpetual', 'trading', 'perps', 'futures', 'aptos']
    };
    
    // Check for related terms
    const terms = relatedTerms[protocol_lc] || [];
    for (const term of terms) {
      if (text.includes(term.toLowerCase())) {
        score += 0.5;
      }
    }
  }
  
  // Engagement factors (likes, replies, retweets)
  if (tweet.likes) score += Math.min(tweet.likes / 100, 1);
  if (tweet.retweets) score += Math.min(tweet.retweets / 50, 1);
  if (tweet.replies) score += Math.min(tweet.replies / 20, 1);
  
  // Verified accounts get a small boost
  if (tweet.isVerified) score += 0.5;
  
  // Recency factor (tweets in the last 24 hours get a boost)
  const tweetTime = tweet.timeParsed ? new Date(tweet.timeParsed).getTime() : 0;
  const now = Date.now();
  const hoursAgo = (now - tweetTime) / (1000 * 60 * 60);
  if (hoursAgo < 24) {
    score += 1 - (hoursAgo / 24); // More recent = higher score
  }
  
  return score;
}

/**
 * Get tweets related to specific protocols
 * @param protocols Array of protocol names
 * @param tweetsPerProtocol Number of tweets to fetch per protocol
 * @param scraper An authenticated Twitter scraper
 * @returns Object with protocol names as keys and arrays of protocol tweets as values
 */
export async function getProtocolTweets(
  protocols: string[],
  tweetsPerProtocol = 3,
  providedScraper?: Scraper
): Promise<Record<string, ProtocolTweet[]>> {
  const scraper = providedScraper || await getScraper();
  const result: Record<string, ProtocolTweet[]> = {};
  
  for (const protocol of protocols) {
    try {
      // Search for tweets related to the protocol
      const searchQuery = `${protocol} blockchain`;
      let tweets: Tweet[] = [];
      
      try {
        // Try using the search method if it exists
        if ('search' in scraper) {
          // @ts-ignore - We need to ignore type mismatch here as we're adapting two different interfaces
          const tweetGenerator = await scraper.search(searchQuery, { 
            limit: tweetsPerProtocol * 3 // Get a larger sample to filter from
          });
          
          // Handle generator to array conversion
          for await (const tweet of tweetGenerator) {
            // Add isVerified property if missing
            const rawTweet = tweet as Partial<Tweet>;
            const processedTweet: Tweet = {
              ...rawTweet as Tweet,
              isVerified: rawTweet.isVerified ?? false
            };
            tweets.push(processedTweet);
          }
        } else {
          throw new Error('Search method not available');
        }
      } catch (error) {
        // Fallback to getTweets if search doesn't exist
        console.log('Search method not available, falling back to getTweets');
        // @ts-ignore - We need to ignore type mismatch here as we're adapting two different interfaces
        const tweetGenerator = await scraper.getTweets(protocol, tweetsPerProtocol * 2);
        
        // Handle generator to array conversion
        tweets = [];  // Reset tweets array
        for await (const tweet of tweetGenerator) {
          // Add isVerified property if missing
          const rawTweet = tweet as Partial<Tweet>;
          const processedTweet: Tweet = {
            ...rawTweet as Tweet,
            isVerified: rawTweet.isVerified ?? false
          };
          tweets.push(processedTweet);
        }
      }
      
      // Calculate relevance scores for each tweet
      const protocolTweets = tweets.map(tweet => ({
        ...tweet,
        protocol,
        relevanceScore: calculateRelevanceScore(tweet, protocol)
      }));
      
      // Sort by relevance
      const sortedTweets = protocolTweets.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      // Limit to requested number of tweets
      const limitedTweets = sortedTweets.slice(0, tweetsPerProtocol);
      
      result[protocol] = limitedTweets;
    } catch (error) {
      console.error(`Error fetching tweets for protocol ${protocol}:`, error);
      result[protocol] = [];
    }
  }
  
  return result;
}

// Export auth functions
export { getScraper, isAuthenticated } from './auth';

// Export types
export type { GetTweetsOptions, Scraper, Tweet, TweetSearchOptions };

