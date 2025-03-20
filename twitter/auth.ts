import { Scraper } from 'agent-twitter-client';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { Cookie } from 'tough-cookie';

dotenv.config();

// Default cookie file path
const DEFAULT_COOKIE_FILE = path.join(process.cwd(), 'twitter-cookies.json');

/**
 * Get an authenticated Twitter scraper instance
 * @param options Configuration options
 * @returns Authenticated scraper instance
 */
export async function getScraper(options: {
  cookiesOnly?: boolean;
  cookieFile?: string;
  username?: string;
  password?: string;
} = {}) {
  const {
    cookiesOnly = false,
    cookieFile = DEFAULT_COOKIE_FILE,
    username = process.env.TWITTER_USERNAME,
    password = process.env.TWITTER_PASSWORD
  } = options;

  const scraper = new Scraper();

  // Try to load cookies from file
  try {
    if (fs.existsSync(cookieFile)) {
      const cookieData = JSON.parse(fs.readFileSync(cookieFile, 'utf8'));

      // The agent-twitter-client library expects cookie strings, not Cookie objects
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      const cookieStrings = cookieData.map((cookieJson: any) => {
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
          // Use the string format that the library expects
          await scraper.setCookies(cookieStrings);
          
          // Verify the cookies are still valid
          if (await scraper.isLoggedIn()) {
            console.log('Successfully authenticated using saved cookies');
            return scraper;
          }
          console.log('Saved cookies expired');
        } catch (cookieError) {
          console.error('Error setting cookies:', cookieError);
        }
      } else {
        console.log('No valid cookies found in cookie file');
      }

      // If cookiesOnly is true, don't attempt to login with credentials
      if (cookiesOnly) {
        throw new Error('Cookies are invalid and cookiesOnly flag is set');
      }
    }
  } catch (error) {
    console.error('Error loading cookies:', error);

    // If cookiesOnly is true, propagate the error
    if (cookiesOnly) {
      throw error;
    }
  }

  // Fall back to password login if cookies don't exist or are invalid
  if (!username || !password) {
    throw new Error('Twitter credentials not provided. Set TWITTER_USERNAME and TWITTER_PASSWORD in .env file or pass them as parameters');
  }

  console.log('Logging in with credentials...');
  try {
    await scraper.login(username, password);
    
    // Save the cookies for future use
    const cookies = await scraper.getCookies();
    fs.writeFileSync(cookieFile, JSON.stringify(cookies));
    console.log('Logged in and saved new cookies');
  } catch (loginError) {
    console.error('Login failed:', loginError);
    throw loginError;
  }

  return scraper;
}

/**
 * Save Twitter session cookies to a file
 * @param scraper Authenticated scraper instance
 * @param cookieFile Path to the cookie file
 */
export async function saveCookies(scraper: Scraper, cookieFile: string = DEFAULT_COOKIE_FILE): Promise<void> {
  const cookies = await scraper.getCookies();
  fs.writeFileSync(cookieFile, JSON.stringify(cookies));
  console.log(`Cookies saved to ${cookieFile}`);
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
