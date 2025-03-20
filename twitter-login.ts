import { Scraper } from 'agent-twitter-client';
import dotenv from 'dotenv';
import fs from 'node:fs';
import { Cookie } from 'tough-cookie'; // Add this import
dotenv.config();

const COOKIE_FILE = './twitter-cookies.json';

async function getScraper() {
    const scraper = new Scraper();

    // Try to load cookies from file
    try {
        if (fs.existsSync(COOKIE_FILE)) {
            const cookieData = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf8'));

            // Convert the JSON objects back to Cookie objects or strings
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            const cookieObjects = cookieData.map((cookieJson: any) => {
                // Either convert to Cookie object
                return Cookie.fromJSON(cookieJson);
                // Or use the serialized string format if that's what setCookies expects
                // return cookieJson.toString(); 
            });

            await scraper.setCookies(cookieObjects);

            // Verify the cookies are still valid
            if (await scraper.isLoggedIn()) {
                console.log('Successfully authenticated using saved cookies');
                return scraper;
            }
            console.log('Saved cookies expired, logging in with credentials');
        }
    } catch (error) {
        console.error('Error loading cookies:', error);
    }

    // Fall back to password login if cookies don't exist or are invalid
    if (!process.env.TWITTER_USERNAME || !process.env.TWITTER_PASSWORD) {
        throw new Error('TWITTER_USERNAME and TWITTER_PASSWORD must be set in .env file');
    }

    // await scraper.login(
    //     process.env.TWITTER_USERNAME,
    //     process.env.TWITTER_PASSWORD
    // );

    // // Save the cookies for future use
    // const cookies = await scraper.getCookies();
    // fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies));
    // console.log('Logged in and saved new cookies');

    return scraper;
}

async function main() {
    const scraper = await getScraper();

    // Now use the authenticated scraper for your operations
    console.log('Logged in successfully!');

    // Your code here...
}

main().catch(error => {
    console.error('Error:', error);
});
