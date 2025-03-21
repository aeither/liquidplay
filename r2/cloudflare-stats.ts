import Cloudflare from 'cloudflare';

const client = new Cloudflare({
    apiKey: process.env.CLOUDFLARE_API_TOKEN,
});

async function main() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID as string;

    // List all buckets
    const bucketList = await client.r2.buckets.list({ account_id: accountId });
    console.log("Buckets:", bucketList.buckets);
    const metrics = await client.r2.buckets.metrics.list({ account_id: accountId });
    console.log("Metrics:", metrics);
}

main().catch(console.error);
