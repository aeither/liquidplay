// Example of using R2 cookie storage
import dotenv from 'dotenv';
import { deleteCookies, retrieveCookies, storeCookies, type Cookie } from '../r2/s3client-aws';

// Load environment variables
dotenv.config();

async function main() {
    const userId = "user123";

    // Example cookies
    const cookies: Cookie[] = [
        {
            key: "twitter_auth",
            value: "abc123xyz",
            expires: new Date(Date.now() + 86400000).toISOString(),
            domain: "twitter.com",
            path: "/",
            secure: true,
            hostOnly: false,
            creation: new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
            sameSite: "None"
        },
        {
            key: "twitter_session",
            value: "session789",
            expires: new Date(Date.now() + 3600000).toISOString(),
            domain: "twitter.com",
            path: "/",
            secure: true,
            httpOnly: true,
            hostOnly: false,
            creation: new Date().toISOString(),
            lastAccessed: new Date().toISOString(),
            sameSite: "Lax"
        }
    ];

    // Store cookies
    await storeCookies(userId, cookies);
    console.log("Cookies stored");

    // Retrieve cookies
    const retrievedCookies = await retrieveCookies(userId);
    console.log("Retrieved cookies:", retrievedCookies);

    // Optional: Delete cookies to clean up
    // Uncomment the lines below to test deletion
    await deleteCookies(userId);
    console.log("Cookies deleted");
}

// Run the example
main().catch(console.error);
