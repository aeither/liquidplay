import { type Scraper, SearchMode, type Tweet } from 'agent-twitter-client';
import { getScraper } from './auth';

/**
 * Extended Tweet type with protocol relevance information
 */
export interface ProtocolTweet extends Tweet {
  relevanceScore: number;
  protocol: string;
  source: string;
}

/**
 * Get tweets from a specific account
 * @param account Twitter account handle (without @)
 * @param limit Maximum number of tweets to fetch
 * @param scraper Optional authenticated scraper instance
 * @returns Array of tweets
 */
export async function getTweetsFromAccount(
  account: string,
  limit = 10,
  scraper?: Scraper
): Promise<Tweet[]> {
  const tweets: Tweet[] = [];

  // Get a scraper instance if not provided
  const twitterClient = scraper || await getScraper();

  try {
    console.log(`Fetching tweets from @${account}...`);

    // Fetch tweets using the generator
    for await (const tweet of twitterClient.getTweets(account, limit)) {
      tweets.push(tweet);

      if (tweets.length >= limit) break;
    }

    return tweets;
  } catch (error) {
    console.error(`Error fetching tweets from @${account}:`, error);
    throw error;
  }
}

/**
 * Search for tweets by keyword or phrase
 * @param query Search query
 * @param options Search options
 * @param scraper Optional authenticated scraper instance
 * @returns Array of tweets matching the search
 */
export async function searchTweets(
  query: string,
  options: {
    limit?: number;
    mode?: SearchMode;
    minLikes?: number;
    minRetweets?: number;
    minReplies?: number;
  } = {},
  scraper?: Scraper
): Promise<Tweet[]> {
  // Get a scraper instance if not provided
  const twitterClient = scraper || await getScraper();

  try {
    console.log(`Searching for tweets with query: "${query}"...`);

    // Search for Aptos web3 with a limit of 5 tweets
    const searchResults: Tweet[] = [];

    for await (const tweet of twitterClient.searchTweets(query, options.mode || SearchMode.Top)) {
      searchResults.push(tweet);

      if (searchResults.length >= (options.limit || 5)) break;
    }

    return searchResults;
  } catch (error) {
    console.error(`Error searching for tweets with query "${query}":`, error);
    throw error;
  }
}

/**
 * Get tweets from protocol Twitter accounts
 * @param protocols List of Twitter handles to fetch tweets from
 * @param limit Maximum number of tweets per protocol
 * @param scraper Optional authenticated scraper instance
 * @returns Map of protocol names to their tweets
 */
export async function getProtocolTweets(
  protocols: string[],
  limit = 10,
  scraper?: Scraper
): Promise<Record<string, ProtocolTweet[]>> {
  // Initialize result object
  const protocolTweets: Record<string, ProtocolTweet[]> = {};

  // Get a scraper instance if not provided
  const twitterClient = scraper || await getScraper();

  // Initialize all protocols with empty arrays
  for (const protocol of protocols) {
    protocolTweets[protocol] = [];
  }

  // Get tweets directly from each protocol account
  for (const protocol of protocols) {
    try {
      const tweets = await getTweetsFromAccount(protocol, limit, twitterClient);

      // Add source info and convert to ProtocolTweet
      for (const tweet of tweets) {
        protocolTweets[protocol].push({
          ...tweet,
          protocol: protocol,
          source: protocol,
          relevanceScore: calculateRelevanceScore(tweet, protocol),
        });
      }
    } catch (error) {
      console.error(`Error fetching tweets for ${protocol}:`, error);
      // Continue with other protocols
    }
  }

  // Also search for protocol mentions
  for (const protocol of protocols) {
    try {
      // Search for mentions of the protocol
      const searchQuery = `${protocol} (aptos OR defi OR web3) -is:retweet`;
      const mentionTweets = await searchTweets(
        searchQuery,
        { limit: limit, minLikes: 5 },
        twitterClient
      );

      // Add source info and convert to ProtocolTweet
      for (const tweet of mentionTweets) {
        // Skip if from the official account (already included)
        if (tweet.username && tweet.username.toLowerCase() === protocol.toLowerCase()) {
          continue;
        }

        protocolTweets[protocol].push({
          ...tweet,
          protocol,
          source: 'mention',
          relevanceScore: calculateRelevanceScore(tweet, protocol),
        });
      }
    } catch (error) {
      console.error(`Error searching for ${protocol} mentions:`, error);
      // Continue with other protocols
    }
  }

  // Sort by relevance score and limit the results
  for (const protocol of protocols) {
    protocolTweets[protocol] = protocolTweets[protocol]
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  return protocolTweets;
}

/**
 * Calculate a relevance score for a tweet based on its relation to a protocol
 * 
 * @param tweet Tweet object to analyze
 * @param protocol Protocol name to score against
 * @returns Numerical score representing relevance
 */
function calculateRelevanceScore(tweet: Tweet, protocol: string): number {
  const tweetText = tweet.text?.toLowerCase() || '';
  const protocolLower = protocol.toLowerCase();
  let score = 0;

  // Basic matching (protocol name appears in tweet)
  if (tweetText.includes(protocolLower)) {
    score += 5;

    // Protocol name in hashtag form
    if (tweetText.includes(`#${protocolLower}`)) {
      score += 2;
    }

    // Protocol name at beginning of tweet
    if (tweetText.startsWith(protocolLower) || tweetText.startsWith(`#${protocolLower}`)) {
      score += 1;
    }
  }

  // Engagement metrics boost relevance
  const likes = tweet.likes || 0;
  const retweets = tweet.retweets || 0;

  // Add weighted engagement metrics
  score += (likes / 100) + (retweets / 20);

  // Limit to 10 max
  return Math.min(score, 10);
}
