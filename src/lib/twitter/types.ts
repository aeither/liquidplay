import type { SearchMode } from 'agent-twitter-client';

/**
 * Basic Twitter account information
 */
export interface TwitterAccount {
  username: string;
  displayName?: string;
  bio?: string;
  followers?: number;
  following?: number;
  verified?: boolean;
}

/**
 * Basic tweet data structure
 */
export interface TweetData {
  id: string;
  text: string;
  timestamp: string;
  username: string;
  retweets?: number;
  likes?: number;
  replies?: number;
  url?: string;
}

/**
 * Extended tweet data for protocol-specific information
 */
export interface ProtocolTweetData extends TweetData {
  protocol: string;
  source: string;  // Twitter handle or 'mention'
  relevanceScore: number;  // Score based on engagement metrics
}

/**
 * Options for searching tweets
 */
export interface SearchOptions {
  limit?: number;
  mode?: SearchMode;
  minLikes?: number;
  minRetweets?: number;
  minReplies?: number;
}

/**
 * Protocol information with associated tweets
 */
export interface ProtocolInfo {
  name: string;
  twitterHandles: string[];
  tweets: ProtocolTweetData[];
  sentimentScore?: number;
  engagementScore?: number;
}

/**
 * Protocol tweet analysis results
 */
export interface ProtocolAnalysis {
  protocol: string;
  tweetCount: number;
  averageEngagement: number;
  sentimentScore: number;
  recentActivity: boolean;
  topTweets: ProtocolTweetData[];
}
