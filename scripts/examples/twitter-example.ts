import type { Tweet } from 'agent-twitter-client';
import dotenv from 'dotenv';
import { getProtocolTweets, getScraper, getTweetsFromAccount, searchTweets, type ProtocolTweet } from '../twitter';

// Load environment variables
dotenv.config();

async function main(): Promise<void> {
  try {
    // Get an authenticated scraper instance
    console.log('Authenticating with Twitter...');
    const scraper = await getScraper({
      // Explicitly set cookiesOnly to false to use credentials if cookies fail
      cookiesOnly: true,
    });
    
    // Example 1: Get tweets from a specific account
    const accountTweets: Tweet[] = await getTweetsFromAccount('AptosLabs', 5, scraper);
    console.log('\n--- Tweets from @AptosLabs ---');
    for (const tweet of accountTweets) {
      const text = tweet.text || '';
      console.log(`${tweet.timeParsed || 'Unknown date'}: ${text.substring(0, 100)}... [${tweet.likes ?? 0} likes, ${tweet.retweets ?? 0} RTs]`);
    }
    
    // Example 2: Search for tweets mentioning "Aptos"
    const searchResults: Tweet[] = await searchTweets('Aptos web3', { limit: 5 }, scraper);
    console.log('\n--- Search results for "Aptos web3" ---');
    for (const tweet of searchResults) {
      const text = tweet.text || '';
      console.log(`@${tweet.username}: ${text.substring(0, 100)}... [${tweet.likes ?? 0} likes]`);
    }
    
    // Example 3: Get tweets for multiple protocols
    const protocols: string[] = ['Joule', 'Thala', 'LiquidSwap'];
    console.log(`\n--- Fetching tweets for protocols: ${protocols.join(', ')} ---`);
    const protocolTweets: Record<string, ProtocolTweet[]> = await getProtocolTweets(protocols, 3, scraper);
    
    // Display results for each protocol
    for (const [protocol, tweets] of Object.entries(protocolTweets)) {
      console.log(`\n${protocol} (${tweets.length} tweets):`);
      let i = 0;
      for (const tweet of tweets) {
        i++;
        const text = tweet.text || '';
        console.log(`  ${i}. [Score: ${tweet.relevanceScore.toFixed(1)}] @${tweet.username}: ${text.substring(0, 80)}...`);
      }
    }
    
  } catch (error) {
    console.error('Error running Twitter example:', error);
  }
}

// Run the example
main().catch(console.error);
