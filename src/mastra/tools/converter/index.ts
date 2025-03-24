// create the tools for database
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';


export const formatRequestTool = createTool({
    id: 'format-request',
    description: 'String formatter, Run this tool to format the transaction request string before any other tools',
    inputSchema: z.object({
        requestString: z.string().describe('The user\'s transaction request string')
    }),
    execute: async ({ mastra, context }) => {

        if (!mastra) {
            throw new Error('Mastra instance is required');
        }
        const workflow = mastra.getWorkflow("transactionRewardsWorkflow");
        const { start } = await workflow.createRun({});
        const result = await start({ triggerData: { requestString: context.requestString } })
        console.log("results", result.results);

        if (result.results['parse-transaction-request'].status !== 'success') {
            throw new Error('Failed to parse transaction request');
        }

        return result.results['parse-transaction-request'].output?.formattedRequest;
    },
});