import { Scraper } from 'agent-twitter-client';
import dotenv from 'dotenv';
import { retrieveCookies, storeCookies } from '../r2/s3client';

dotenv.config();

// Default user ID for storing cookies
const DEFAULT_USER_ID = 'twitter-default-user';

/**
 * Get an authenticated Twitter scraper instance with R2 cookie storage
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
    cookiesOnly = false,
    userId = DEFAULT_USER_ID,
    username = process.env.TWITTER_USERNAME,
    password = process.env.TWITTER_PASSWORD
  } = options;

  const scraper = new Scraper();

  // Try to load cookies from R2
  try {
    const storedCookies = await retrieveCookies(userId);
    
    if (storedCookies && storedCookies.length > 0) {
      try {
        // The cookies are stored as objects but need to be converted to strings for the scraper
        const cookieStrings = storedCookies.map(cookie => {
          // Use template literals for better readability
          return `${cookie.key}=${cookie.value}${cookie.domain ? `; Domain=${cookie.domain}` : ''}${cookie.path ? `; Path=${cookie.path}` : ''}${cookie.expires ? `; Expires=${cookie.expires}` : ''}${cookie.httpOnly ? '; HttpOnly' : ''}${cookie.secure ? '; Secure' : ''}${cookie.sameSite ? `; SameSite=${cookie.sameSite}` : ''}`;
        });
        
        if (cookieStrings.length > 0) {
          // Use the string format that the library expects
          await scraper.setCookies(cookieStrings);
          
          // Verify the cookies are still valid
          if (await scraper.isLoggedIn()) {
            console.log('Successfully authenticated using saved cookies from R2');
            return scraper;
          }
          console.log('Saved cookies expired');
        } else {
          console.log('No valid cookies found in R2 storage');
        }
      } catch (cookieError) {
        console.error('Error setting cookies:', cookieError);
      }

      // If cookiesOnly is true, don't attempt to login with credentials
      if (cookiesOnly) {
        throw new Error('Cookies are invalid and cookiesOnly flag is set');
      }
    }
  } catch (error) {
    console.error('Error loading cookies from R2:', error);

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
    
    // Save the cookies to R2 for future use
    const cookies = await scraper.getCookies();
    
    // Convert Twitter cookie objects to R2 compatible format
    const storableCookies = cookies.map(cookie => {
      // Create a simple object with just the properties we need
      return {
        key: cookie.key,
        value: cookie.value,
        domain: typeof cookie.domain === 'string' ? cookie.domain : undefined,
        path: typeof cookie.path === 'string' ? cookie.path : undefined,
        expires: cookie.expires instanceof Date ? cookie.expires.toISOString() : undefined,
        httpOnly: typeof cookie.httpOnly === 'boolean' ? cookie.httpOnly : undefined,
        secure: typeof cookie.secure === 'boolean' ? cookie.secure : undefined,
        sameSite: typeof cookie.sameSite === 'string' ? cookie.sameSite : undefined
      };
    });
    
    // Store the cookies in a format compatible with R2
    await storeCookies(userId, storableCookies);
    console.log('Logged in and saved new cookies to R2');
  } catch (loginError) {
    console.error('Login failed:', loginError);
    throw loginError;
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
