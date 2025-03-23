import { getWalletBalance } from "@/lib/move";
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

// Tool for checking a wallet's balance
export const balanceTool = createTool({
  id: 'get-balance',
  description: 'Get the current balance of an Aptos wallet',
  inputSchema: z.object({}),
  outputSchema: z.object({
    address: z.string(),
    balance: z.string(),
    network: z.string(),
  }),
  execute: async ({ mastra }) => {

    // if (!mastra) {
    //   throw new Error('Mastra instance is required');
    // }
    // const workflow = mastra.getWorkflow("weatherWorkflow");
    // const { start } = await workflow.createRun({});
    // const result = await start({ triggerData: { city: "Beijing" } })
    // console.log("results", result);

    return await getWalletBalance();
  },
});
