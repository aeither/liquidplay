// create the tools for database
import { db } from '@/lib/db/drizzle';
import { boosts, users } from '@/lib/db/schema';
import { createTool } from '@mastra/core/tools';
import { desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { showProfileTool } from './profile';
export { showProfileTool };

/**
 * Tool to get a leaderboard of users ordered by points
 */
export const getLeaderboardTool = createTool({
  id: 'get-leaderboard',
  description: 'Get a leaderboard of all users ordered by points (highest first)',
  inputSchema: z.object({
    limit: z.number().default(10).describe('Maximum number of users to return'),
  }),
  outputSchema: z.object({
    leaderboard: z.array(
      z.object({
        address: z.string(),
        points: z.string(),
        rank: z.number(),
      })
    ),
  }),
  execute: async ({ context }) => {
    const { limit } = context;
    
    const leaderboard = await db
      .select({
        address: users.address,
        points: users.points
      })
      .from(users)
      .orderBy(desc(users.points))
      .limit(limit);
    
    // Add rank to each user
    const leaderboardWithRank = leaderboard.map((user, index) => ({
      ...user,
      // Convert points to string since that's how it's stored in the DB
      points: user.points?.toString() || "0",
      rank: index + 1,
    }));
    
    return { leaderboard: leaderboardWithRank };
  },
});

/**
 * Tool to get all protocols with their boost multipliers
 */
export const getAllProtocolsTool = createTool({
  id: 'get-all-protocols',
  description: 'Get all protocols with their boost multipliers',
  inputSchema: z.object({}),
  outputSchema: z.object({
    protocols: z.array(
      z.object({
        protocol: z.string(),
        multiplier: z.string(),
      })
    ),
  }),
  execute: async () => {
    const allBoosts = await db
      .select()
      .from(boosts);
    
    // Convert multipliers to strings for consistency
    const protocolsData = allBoosts.map(boost => ({
      protocol: boost.protocol,
      multiplier: boost.multiplier?.toString() || "1.0",
    }));
    
    return { protocols: protocolsData };
  },
});

/**
 * Tool to create a user if the address doesn't exist, or add points if it does
 */
export const upsertUserTool = createTool({
  id: 'upsert-user',
  description: 'Create a user if address does not exist, otherwise add the specified points',
  inputSchema: z.object({
    address: z.string().describe('User wallet address'),
    points: z.number().describe('Points to add (or set if new user)'),
  }),
  outputSchema: z.object({
    user: z.object({
      address: z.string(),
      points: z.string(),
      wasCreated: z.boolean(),
    }),
  }),
  execute: async ({ context,mastra }) => {
    const { address, points } = context;

    // Normalize address to lowercase
    const userAddress = address.toLowerCase();
    const pointsToAdd = points.toString();
    
    // Check if user exists first to determine if this is a new user
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.address, userAddress))
      .limit(1);
    
    const isNewUser = existingUser.length === 0;
    
    // Perform the upsert operation
    const upsertUser = await db
      .insert(users)
      .values({
        address: userAddress,
        points: pointsToAdd
      })
      .onConflictDoUpdate({
        target: users.address,
        set: {
          points: sql`${users.points} + ${pointsToAdd}`
        }
      })
      .returning();
    
    if (!upsertUser || upsertUser.length === 0) {
      throw new Error("Failed to upsert user");
    }
    
    return { 
      user: {
        address: upsertUser[0].address,
        points: upsertUser[0].points?.toString() || "0",
        wasCreated: isNewUser,
      }
    };
  },
});

/**
 * Tool to update a protocol boost multiplier
 */
export const updateProtocolBoostTool = createTool({
  id: 'update-protocol-boost',
  description: 'Update the boost multiplier for a specific protocol',
  inputSchema: z.object({
    protocol: z.string().describe('Protocol name'),
    multiplier: z.number().describe('New multiplier value'),
  }),
  outputSchema: z.object({
    protocol: z.object({
      name: z.string(),
      multiplier: z.string(),
      previousMultiplier: z.string().optional(),
    }),
  }),
  execute: async ({ context }) => {
    const { protocol, multiplier } = context;
    
    // Get the current multiplier first (if exists)
    const currentProtocol = await db
      .select()
      .from(boosts)
      .where(eq(boosts.protocol, protocol))
      .limit(1);
    
    const previousMultiplier = currentProtocol.length > 0 && currentProtocol[0].multiplier
      ? currentProtocol[0].multiplier.toString() 
      : undefined;
    
    // If protocol doesn't exist, create it, otherwise update it
    const operation = currentProtocol.length === 0
      ? db.insert(boosts).values({
          protocol: protocol,
          multiplier: multiplier.toString(),
        })
      : db.update(boosts)
          .set({
            multiplier: multiplier.toString(),
          })
          .where(eq(boosts.protocol, protocol));
    
    const result = await operation.returning();
    
    if (!result || result.length === 0) {
      throw new Error("Failed to update protocol boost");
    }
    
    return { 
      protocol: {
        name: result[0].protocol,
        multiplier: result[0].multiplier?.toString() || "0",
        previousMultiplier,
      }
    };
  },
});