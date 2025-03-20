/**
 * Twitter API integration module
 * 
 * This module provides functionality for interacting with Twitter to gather
 * protocol intelligence for the CAST social battle system.
 */

// Export authentication function
export { getScraper, saveCookies, isAuthenticated } from './auth';

// Export data fetching API functions
export { getTweetsFromAccount, searchTweets, getProtocolTweets } from './api';

// Export the ProtocolTweet interface
export type { ProtocolTweet } from './api';

// Re-export the Tweet type from agent-twitter-client
export type { Tweet, Scraper } from 'agent-twitter-client';
