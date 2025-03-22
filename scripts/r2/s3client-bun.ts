// cookie-storage.ts
import { S3Client } from "bun";

// Configure S3 client for Cloudflare R2
const s3Client = new S3Client({
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    endpoint: process.env.R2_ENDPOINT || "",
    bucket: process.env.R2_BUCKET || "cookies-bucket"
});

// Set as default S3 client
Bun.s3 = s3Client;

// Example cookie structure based on your existing format
interface Cookie {
    key: string;
    value: string;
    expires?: string;
    maxAge?: number;
    domain?: string;
    path?: string;
    secure?: boolean;
    hostOnly?: boolean;
    creation?: string;
    lastAccessed?: string;
    sameSite?: string;
    httpOnly?: boolean;
}

/**
 * Store cookies to R2
 * @param userId User identifier
 * @param cookies Array of cookie objects
 */
async function storeCookies(userId: string, cookies: Cookie[]): Promise<void> {
    try {
        const s3File = s3Client.file(`users/${userId}/cookies.json`);
        await s3File.write(JSON.stringify(cookies), {
            type: "application/json"
        });
        console.log(`Cookies for user ${userId} stored successfully`);
    } catch (error) {
        console.error(`Failed to store cookies for user ${userId}:`, error);
        throw error;
    }
}

/**
 * Retrieve cookies from R2
 * @param userId User identifier
 * @returns Array of cookie objects or null if not found
 */
async function retrieveCookies(userId: string): Promise<Cookie[] | null> {
    try {
        const s3File = s3Client.file(`users/${userId}/cookies.json`);

        if (await s3File.exists()) {
            return await s3File.json();
        }
        console.log(`No cookies found for user ${userId}`);
        return null;
    } catch (error) {
        console.error(`Failed to retrieve cookies for user ${userId}:`, error);
        throw error;
    }
}

/**
 * Delete cookies from R2
 * @param userId User identifier
 */
async function deleteCookies(userId: string): Promise<void> {
    try {
        const s3File = s3Client.file(`users/${userId}/cookies.json`);

        if (await s3File.exists()) {
            await s3File.delete();
            console.log(`Cookies for user ${userId} deleted successfully`);
        } else {
            console.log(`No cookies found to delete for user ${userId}`);
        }
    } catch (error) {
        console.error(`Failed to delete cookies for user ${userId}:`, error);
        throw error;
    }
}

// Export functions for use in other modules
export {
    deleteCookies, retrieveCookies, storeCookies, type Cookie
};
