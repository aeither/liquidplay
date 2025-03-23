import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db/drizzle";
import { boosts } from "../src/lib/db/schema";
import { mastra } from "../src/mastra";

// Load environment variables
dotenv.config();

// Define the Tweet type from the Twitter tool
interface Tweet {
  id: string;
  text: string;
  username: string;
  timeParsed: string;
  likes: number;
  retweets: number;
  replies: number;
}

// Define the engagement metrics type
interface EngagementMetrics {
  totalTweets: number;
  totalLikes: number;
  totalRetweets: number;
  totalReplies: number;
  avgLikes: number;
  avgRetweets: number;
  avgReplies: number;
  engagementScore: number;
}

async function main() {
  console.log("🔍 Starting protocol engagement analysis...");

  // List of protocols to analyze
  const protocols: string[] = [
    "PontemNetwork",
    "ThalaLabs", 
    "JouleFinance",
    "AmnisFinance"
  ];

  // Get current protocol boosts from the database
  const currentBoosts = await db.select().from(boosts);
  console.log("📊 Current protocol boosts:", currentBoosts);

  // Process each protocol
  for (const protocol of protocols) {
    console.log(`\n🐦 Analyzing Twitter engagement for ${protocol}...`);
    
    try {
      const agent = mastra.getAgent("twitterAgent");
      // Search for tweets about the protocol using the Twitter tool
      // We access the Twitter search tool directly
      const result = await agent.generate(`Search for tweets about ${protocol}`);
      
      // The tweets should be in the result
      const searchResponse = JSON.parse(result.text);
      
      if (!searchResponse?.tweets || searchResponse.tweets.length === 0) {
        console.log(`⚠️ No tweets found for ${protocol}`);
        continue;
      }
      
      console.log(`✅ Found ${searchResponse.tweets.length} tweets for ${protocol}`);
      
      // Calculate engagement metrics
      const engagement = calculateEngagement(searchResponse.tweets as Tweet[]);
      console.log(`📈 Engagement metrics for ${protocol}:`, engagement);
      
      // Calculate new boost multiplier based on engagement
      const newMultiplier = calculateBoostMultiplier(engagement);
      console.log(`🚀 New boost multiplier for ${protocol}: ${newMultiplier}`);
      
      // Update the database with the new multiplier
      await db.update(boosts)
        .set({ multiplier: newMultiplier.toString() })
        .where(eq(boosts.protocol, protocol));
      
      console.log(`💾 Updated ${protocol} boost multiplier in database`);
    } catch (error) {
      console.error(`❌ Error processing ${protocol}:`, error);
    }
  }

  console.log("\n✨ Protocol boost update completed!");
}

/**
 * Calculate engagement metrics from a list of tweets
 */
function calculateEngagement(tweets: Tweet[]): EngagementMetrics {
  // Initialize metrics
  let totalLikes = 0;
  let totalRetweets = 0;
  let totalReplies = 0;
  const tweetCount = tweets.length;
  
  // Sum up engagement metrics from all tweets
  for (const tweet of tweets) {
    totalLikes += tweet.likes || 0;
    totalRetweets += tweet.retweets || 0;
    totalReplies += tweet.replies || 0;
  }
  
  // Calculate average engagement per tweet
  const avgLikes = totalLikes / tweetCount;
  const avgRetweets = totalRetweets / tweetCount;
  const avgReplies = totalReplies / tweetCount;
  
  // Calculate overall engagement score (weighted)
  const engagementScore = (
    (avgLikes * 1) + 
    (avgRetweets * 2) + 
    (avgReplies * 1.5)
  ) / 4.5;
  
  return {
    totalTweets: tweetCount,
    totalLikes,
    totalRetweets,
    totalReplies,
    avgLikes,
    avgRetweets,
    avgReplies,
    engagementScore
  };
}

/**
 * Calculate a boost multiplier based on engagement metrics
 * This uses a logarithmic scale to prevent extremely high or low values
 */
function calculateBoostMultiplier(engagement: EngagementMetrics): number {
  // Base multiplier
  const baseMultiplier = 1.5;
  
  // Engagement factor (logarithmic scale)
  const engagementFactor = Math.log10(engagement.engagementScore + 1) / 2;
  
  // Calculate final multiplier (between 1.0 and 3.0)
  const multiplier = Math.max(1.0, Math.min(3.0, baseMultiplier + engagementFactor));
  
  // Round to 2 decimal places
  return Math.round(multiplier * 100) / 100;
}

// Run the script
main()
  .catch(error => {
    console.error("Error running script:", error);
    process.exit(1);
  })
  .finally(async () => {
    // Close database connection
    await db.execute('SELECT 1');
    process.exit(0);
  });