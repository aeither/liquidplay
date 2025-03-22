// S3 client for Cloudflare R2
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
import type { Cookie } from 'tough-cookie';
dotenv.config();

// Configure S3 client for Cloudflare R2
const s3Client = new S3Client({
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
    endpoint: process.env.R2_ENDPOINT || "",
    region: "auto", // R2 uses "auto" as the region
});

const bucketName = process.env.R2_BUCKET || "cookies-bucket";

// Error interface for AWS errors
interface AwsError extends Error {
    name: string;
    $metadata?: {
        httpStatusCode?: number;
    };
}

/**
 * Store cookies to R2
 * @param userId User identifier
 * @param cookies Array of cookie objects
 */
export async function storeCookies(userId: string, cookies: Cookie[]): Promise<void> {
    try {
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: `users/${userId}/cookies.json`,
            Body: JSON.stringify(cookies),
            ContentType: "application/json"
        });
        await s3Client.send(command);
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
export async function retrieveCookies(userId: string): Promise<Cookie[] | null> {
    try {
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: `users/${userId}/cookies.json`
        });
        const response = await s3Client.send(command);
        const bodyContents = await response.Body?.transformToString();
        if (bodyContents) {
            return JSON.parse(bodyContents);
        }
        console.log(`No cookies found for user ${userId}`);
        return null;
    } catch (error) {
        const awsError = error as AwsError;
        if (awsError.name === 'NoSuchKey') {
            console.log(`No cookies found for user ${userId}`);
            return null;
        }
        console.error(`Failed to retrieve cookies for user ${userId}:`, error);
        throw error;
    }
}

/**
 * Delete cookies from R2
 * @param userId User identifier
 */
export async function deleteCookies(userId: string): Promise<void> {
    try {
        const headCommand = new HeadObjectCommand({
            Bucket: bucketName,
            Key: `users/${userId}/cookies.json`
        });

        try {
            await s3Client.send(headCommand);
        } catch (error) {
            const awsError = error as AwsError;
            if (awsError.name === 'NotFound') {
                console.log(`No cookies found to delete for user ${userId}`);
                return;
            }
            throw error;
        }

        const deleteCommand = new DeleteObjectCommand({
            Bucket: bucketName,
            Key: `users/${userId}/cookies.json`
        });
        await s3Client.send(deleteCommand);
        console.log(`Cookies for user ${userId} deleted successfully`);
    } catch (error) {
        console.error(`Failed to delete cookies for user ${userId}:`, error);
        throw error;
    }
}
