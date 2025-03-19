import { Scraper, SearchMode } from 'agent-twitter-client';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    // Check if required environment variables are defined
    if (!process.env.TWITTER_USERNAME || !process.env.TWITTER_PASSWORD) {
        throw new Error('TWITTER_USERNAME and TWITTER_PASSWORD must be set in .env file');
    }

    const scraper = new Scraper();
    // v1 login
    await scraper.login(
        process.env.TWITTER_USERNAME,
        process.env.TWITTER_PASSWORD,
    );

    console.log('Logged in successfully!');

    // 1. Get latest 5 posts from home timeline
    console.log('Getting latest 5 posts from home timeline:');
    const homeTimeline = await scraper.fetchFollowingTimeline(5, []);
    console.log("🚀 ~ main ~ homeTimeline:", homeTimeline);

    // The returned data appears to be an array of tweet objects directly
    const homePosts = homeTimeline.slice(0, 5);
    console.log('Home timeline posts:', homePosts);

    // 2. Get latest posts from a specific user
    const username = 'JouleFinance'; // Change to any username you want
    console.log(`Getting latest posts from ${username}:`);
    const userPosts = [];

    for await (const tweet of scraper.getTweets(username, 10)) {
        userPosts.push(tweet);
    }

    console.log(`Latest posts from ${username}:`, userPosts);

    // 3. Get posts from search with filters (latest, minimum likes)
    const searchTerm = 'javascript';
    const minLikes = 100; // Minimum likes threshold
    console.log(`Searching for latest "${searchTerm}" tweets with at least ${minLikes} likes:`);

    // Search for latest tweets
    const searchResults = [];
    for await (const tweet of scraper.searchTweets(searchTerm, 50, SearchMode.Latest)) {
        // Filter by minimum likes using the correct property
        if (tweet.likes && tweet.likes >= minLikes) {
            searchResults.push(tweet);
            // Stop after finding 10 matching tweets
            if (searchResults.length >= 10) break;
        }
    }

    console.log(`Search results for "${searchTerm}" with at least ${minLikes} likes:`, searchResults);
}

main().catch(error => {
    console.error('Error:', error);
});
