import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { getWalletBalance } from '@/lib/move';
import { createTool } from '@mastra/core/tools';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Tool for showing a user profile
export const showProfileTool = createTool({
  id: 'showProfileTool',
  description: 'Show User Profile UI',
  inputSchema: z.object({
  }),
  outputSchema: z.object({
    title: z.string(),
    description: z.string(),
    url: z.string(),
  }),
  execute: async ({ context }) => {
    const { address, balance } = await getWalletBalance();

    // If query is an Ethereum address
    if (address.startsWith('0x')) {
      try {
        // Try to find the user in the database
        const user = await db.query.users.findFirst({
          where: eq(users.address, address.toLowerCase()),
        });

        if (user) {
          return {
            title: `${user.address.substring(0, 6)}...${user.address.substring(38)}`,
            description: `XP: ${user.points}, Balance: ${balance}`,
            url: `https://explorer.aptoslabs.com/account/${user.address}`,
          };
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    }

    // Default or fallback response
    return {
      title: 'User Profile',
      description: `Address: ${address}, Balance: ${balance}`,
      url: `https://explorer.aptoslabs.com/account/${address}`,
    };
  },
});
