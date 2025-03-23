import { sql } from "drizzle-orm";
import { db } from "./drizzle";
import { boosts, users } from "./schema";

// Seed function
async function seed() {
  console.log("Seeding database...");

  // Seed 20 users with random points
  const dummyUsers = [
    { address: "0x206b266f0072831973ab554d0a36c143a5087fa4", points: "5.93" },
    { address: "0x0271a6f6b17e32401debd3ec4448011d0379d966", points: "57.33" },
    { address: "0x2a02cc17149004430a1064fc535f152ee6ab362d", points: "11.88" },
    { address: "0xb5a0991c49d4b0bffef562070d917b6af338b602", points: "23.98" },
    { address: "0xc862a8d6cf4b1506360f610c0325db26621a8d58", points: "26.54" },
    { address: "0xc8a6bae2363356689f9d60616179b375fb5f0b2c", points: "86.13" },
    { address: "0xb92b08d5d64cd09fc6cf68667bb04acd61a588c1", points: "5.72" },
    { address: "0x0cb951f80d77b839da9e978f4bfdc3335b068c53", points: "23.33" },
    { address: "0x134c0688f60ec16897c19a5ed6916693670764fb", points: "52.27" },
    { address: "0x901483c58959251a99ae082068b5f61414fd4126", points: "64.92" },
    { address: "0xc37a275333fdcde177ea68559e1675483d2f0243", points: "72.74" },
    { address: "0xd4bf3a161d82488ffea14fa80ff7656666c21de9", points: "78.17" },
    { address: "0xe4e316a3854f16c8d6fcb076fdda2a70a9fad687", points: "68.23" },
    { address: "0x4f15c61bd2786b5760c9221ef139d56fa2770d12", points: "18.97" },
    { address: "0x4758abb30371b261c0a56b71d6abd0ad75c19240", points: "30.61" },
    { address: "0x0be2e12811b0cc43cb10fdbfe6ee10a7b9353cf7", points: "26.81" },
    { address: "0x1ec1c8d8e3ccabbfe569f9dbf0f1b3cfc590b299", points: "90.16" },
    { address: "0x3f841b0098d5984a6371f212262ba53984792da0", points: "81.56" },
    { address: "0x13779dfd6472887dd8ae9bfffe82b628b939af0f", points: "63.73" },
    { address: "0x9c271519b031104dcde5e57b50487d2370aab237", points: "92.86" }
  ];

  for (const user of dummyUsers) {
    await db.insert(users).values(user);
    console.log(`Inserted user: ${user.address}`);
  }

  // Seed protocols with multipliers
  const protocolData = [
    { protocol: "PontemNetwork", multiplier: "1.70" },
    { protocol: "ThalaLabs", multiplier: "2.66" },
    { protocol: "JouleFinance", multiplier: "2.87" },
    { protocol: "AmnisFinance", multiplier: "2.83" }
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
