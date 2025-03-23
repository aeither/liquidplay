import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Tool for checking a wallet's balance
export const showProfileTool = createTool({
  id: 'show-profile',
  description: 'Show User Profile UI',
  inputSchema: z.object({
    query: z.string(),
  }),
  outputSchema: z.object({
    title: z.string(),
    description: z.string(),
    url: z.string(),
  }),
  execute: async () => {
    return {
      title: 'User Profile',
      description: 'User Profile',
      url: 'https://example.com',
    };
  },
});
