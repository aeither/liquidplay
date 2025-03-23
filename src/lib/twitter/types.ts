// Define the types for the Twitter scraper to match what the library actually provides

export interface TwitterUserProfile {
  id: string;
  username: string;
  fullName?: string;
  biography?: string;
  profileImageUrl?: string;
  followersCount?: number;
  followingCount?: number;
  location?: string;
  url?: string;
  verified?: boolean;
  protected?: boolean;
  joinDate?: string;
  birthDate?: string;
}

/**
 * Tweet interface for the Twitter scraper
 */
export interface Tweet {
  /**
   * Tweet ID
   */
  id: string | undefined;
  
  /**
   * Tweet content
   */
  text: string | undefined;
  
  /**
   * Username of tweet author
   */
  username: string | undefined;
  
  /**
   * Timestamp of the tweet, can be a string or Date object
   */
  timeParsed: string | Date | undefined;
  
  /**
   * Number of likes
   */
  likes: number | undefined;
  
  /**
   * Number of retweets
   */
  retweets: number | undefined;
  
  /**
   * Number of replies
   */
  replies: number | undefined;
  
  /**
   * Whether the tweet author is verified - optional since it might not be provided by all APIs
   */
  isVerified?: boolean;
  
  /**
   * Optional URL to tweet
   */
  url?: string;
  
  /**
   * Optional profile image URL
   */
  profileImageUrl?: string;
  
  /**
   * Optional display name of tweet author
   */
  name?: string;
}

/**
 * Search options for tweet search
 */
export interface TweetSearchOptions {
  /**
   * Maximum number of tweets to return
   */
  limit?: number;
  
  /**
   * Whether to include replies
   */
  includeReplies?: boolean;
}

/**
 * Twitter Cookie interface to match tough-cookie format
 */
export interface TwitterCookie {
  key?: string;  // Using key or name for compatibility
  name?: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: Date | number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: string;
}

/**
 * Interface for getTweets options
 */
export interface GetTweetsOptions {
  limit?: number;
  includeReplies?: boolean;
  includeRetweets?: boolean;
}

/**
 * Scraper interface that matches the Twitter client library's API
 * but provides better type safety for our needs
 */
export interface Scraper {
  /**
   * Login to Twitter
   */
  login(username: string, password: string): Promise<void>;
  
  /**
   * Set cookies for authentication
   */
  setCookies(cookieStrings: string[]): Promise<void>;
  
  /**
   * Get cookies
   */
  getCookies(): Promise<unknown[]>;
  
  /**
   * Check if the scraper is logged in
   */
  isLoggedIn(): Promise<boolean>;
  
  /**
   * Get tweets from a user
   * Note: The library actually returns AsyncGenerator<Tweet, any, any> but we're using
   * a more flexible type to handle both direct arrays and generators
   * 
   * The second parameter can be either a number (maxTweets) or an options object
   */
  getTweets(username: string, maxTweetsOrOptions?: number | GetTweetsOptions | Record<string, unknown>): AsyncGenerator<Tweet, unknown, unknown> | Promise<Tweet[]>;
  
  /**
   * Search for tweets - optional method since it may not exist in all scraper implementations
   * Note: The library actually returns AsyncGenerator<Tweet> but we're using
   * a more flexible type to handle both direct arrays and generators
   */
  search?(query: string, options?: TweetSearchOptions | Record<string, unknown>): AsyncGenerator<Tweet, unknown, unknown> | Promise<Tweet[]>;
}
