import { sql } from "drizzle-orm";
import { db } from "./drizzle";
import { boosts, users } from "./schema";

// Seed function
async function seed() {
  console.log("Seeding database...");

  // Seed 20 users with random points (Aptos addresses)
  const dummyUsers = [
    { address: "0xc27e8b8e5a3789802942c4b058bb63f25675c7139881932a17467e1c1ed17ee1", points: "5.93" },
    { address: "0x7e31cd33ff6cd65603dbfc3dba2c38f27b37c759a4c05e7f092751b42af955bc", points: "57.33" },
    { address: "0x2f45c965f7e3d7de75ca5ea8a4c9d1546e2a5849c5d939f9f9af3ef16143c67a", points: "11.88" },
    { address: "0xb48a9a4c5bed752d9f6cd85742d5d9db83817c8ebb7f107123db5ae159986b38", points: "23.98" },
    { address: "0x14b1a9db49f664dc2cee45ebca9772d6205389a23ef22365bf5053f80cf1cf7b", points: "26.54" },
    { address: "0xe893a1e213b52e71c1a0101c7df5d413b5e29dbf4842d089a9eeb8a9e22797f2", points: "86.13" },
    { address: "0x8a92d3fbd91e0e1c0e0d129d94f3c7398b954ba9a69caf30f5729fdfd667c816", points: "5.72" },
    { address: "0x6e36f10fcd0fad0536a7c8cc94c7557b79ec31bf7f73f68d9f92d30d1b4477d5", points: "23.33" },
    { address: "0x93e553f3d32b94bc041f886e0af46120e6236e2471845d362fc9842c0ed95d9a", points: "52.27" },
    { address: "0xa15f0e6c0fa091e0737f869f6a13bcbc4b8347ce7510d1a5fa9ca13f9fb4f77c", points: "64.92" },
    { address: "0x17d9ae76e393a1c7f892785fa0db9e6a36b08d29ada4c6e1c868baee7108b438", points: "72.74" },
    { address: "0x4c3e8ca478e5b9a6d5e689c90cd9237b0acce269d353455effa5c6a4d6372f3f", points: "78.17" },
    { address: "0x29a5a51c21ee89d16b03a6dee5d278a121f383957b1bfecb7f1968d34f9286d2", points: "68.23" },
    { address: "0xf12e3c5f93f8608f3b61b1a3cf8b2df5394aaed913ccea153226c38425952e71", points: "18.97" },
    { address: "0x2de2cf267e93be5a10c3b40158bcb7788ecd1a3b6f9043d057c94956d4141b4a", points: "30.61" },
    { address: "0xd1fa242dd707b236b712e4234639a38af62a7dc85f6e3e19926741a96a68f742", points: "26.81" },
    { address: "0x1bfdd987cefd90e2c58b85e58f59469456eaa2686a3269d2e2b3c7ac700cdff9", points: "90.16" },
    { address: "0x5c10a09e5770aee21f101793218cebf9122b8543c56475dc1c0f2b73a55ed5a3", points: "81.56" },
    { address: "0x8ac79c7d636042c19a678e87b9bb23e4308efc98b886e067e57fdeeacf92eb16", points: "63.73" },
    { address: "0x34a3d35012f14fefd5e17359e9f149cfa7c1d13c2f7d2e9653ad03bb8cb1bd3e", points: "92.86" }
  ];

  for (const user of dummyUsers) {
    await db.insert(users).values(user);
    console.log(`Inserted user: ${user.address}`);
  }

  // Seed protocols with multipliers
  const protocolData = [
    { protocol: "PontemNetwork", multiplier: "6.72" },
    { protocol: "ThalaLabs", multiplier: "5.55" },
    { protocol: "JouleFinance", multiplier: "5.43" },
    { protocol: "AmnisFinance", multiplier: "5.40" }
  ];

  for (const protocol of protocolData) {
    await db.insert(boosts).values(protocol);
    console.log(`Inserted protocol boost: ${protocol.protocol}`);
  }

  console.log("Seeding completed.");
}

// Run the seed function
seed()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.execute(sql`SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = 'YOUR_DATABASE_NAME'
      AND pid <> pg_backend_pid();`);
    process.exit(0);
  });
