// Import Scraper type separately to avoid initialization problems
import type { Scraper } from 'agent-twitter-client';
import * as dotenv from 'dotenv';
import { Cookie } from 'tough-cookie';
import { retrieveCookies, storeCookies } from '../r2/s3client';
dotenv.config();

// Dynamically import the Scraper class to avoid initialization issues
async function getScraperClass() {
  const { Scraper } = await import('agent-twitter-client');
  return Scraper;
}


// Default user ID for cookies
const DEFAULT_USER_ID = 'default';

/**
 * Get an authenticated Twitter scraper
 * @param options Configuration options
 * @returns Authenticated scraper instance
 */
export async function getScraper(options: {
  cookiesOnly?: boolean;
  userId?: string;
  username?: string;
  password?: string;
} = {}): Promise<Scraper> {
  const {
    cookiesOnly = true,
    userId = DEFAULT_USER_ID,
    username = process.env.TWITTER_USERNAME,
    password = process.env.TWITTER_PASSWORD
  } = options;

  // Dynamically import the Scraper to avoid circular dependencies
  const ScraperClass = await getScraperClass();
  const scraper = new ScraperClass();

  // Try to load cookies from R2
  try {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const cookies: any = await retrieveCookies(userId);
    console.log('Setting cookies for Twitter');

    // The agent-twitter-client library expects cookie strings, not Cookie objects
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const cookieStrings = cookies.map((cookieJson: any) => {
      // Convert each cookie JSON to a string
      try {
        const cookie = Cookie.fromJSON(cookieJson);
        if (cookie) {
          return cookie.toString();
        }
        return null;
      } catch (err) {
        console.error('Error converting cookie:', err);
        return null;
      }
    }).filter(Boolean); // Filter out null values

    if (cookieStrings.length > 0) {
      try {
        // Set the cookies using the string format
        await scraper.setCookies(cookieStrings);

        // Verify login worked
        if (await scraper.isLoggedIn()) {
          console.log('Successfully authenticated with Twitter using cookies');
          return scraper;
        }

        console.log('Cookies expired, trying to login with credentials');
      } catch (cookieError) {
        console.error('Error setting cookies:', cookieError);
      }
    } else {
      console.log('No valid cookie strings could be created from stored cookies');
    }
  } catch (error) {
    console.error('Error retrieving Twitter cookies:', error);
  }

  // If cookies don't work or cookiesOnly is false, try logging in with credentials
  if (!cookiesOnly && username && password) {
    try {
      console.log('Logging in to Twitter with credentials');
      await scraper.login(username, password);

      // Verify login worked
      if (await scraper.isLoggedIn()) {
        console.log('Successfully authenticated with Twitter using credentials');

        // Save cookies for next time
        try {
          // Get cookies directly from the scraper
          const twitterCookies = await scraper.getCookies();

          // Store cookies with minimal processing, just use type assertion to bridge the API differences
          // This treats the Twitter cookie format as compatible with our storage format
          await storeCookies(userId, twitterCookies as unknown as Cookie[]);
          console.log('Successfully stored Twitter cookies');
        } catch (saveCookiesError) {
          console.error('Error saving Twitter cookies:', saveCookiesError);
        }

        return scraper;
      }
    } catch (loginError) {
      console.error('Error logging in to Twitter:', loginError);
    }
  }

  // If we get here, we couldn't authenticate
  if (cookiesOnly) {
    console.warn('No valid Twitter cookies found and cookiesOnly is true');
  } else {
    console.error('Failed to authenticate with Twitter');
  }

  return scraper;
}

/**
 * Check if the scraper is authenticated
 * @param scraper Scraper instance to check
 * @returns true if authenticated, false otherwise
 */
export async function isAuthenticated(scraper: Scraper): Promise<boolean> {
  try {
    return await scraper.isLoggedIn();
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
}
