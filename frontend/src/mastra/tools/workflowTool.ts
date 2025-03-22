import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// Create a tool that executes the workflow
const workflowTool = createTool({
    id: "executeWorkflow",
    description: "Execute the workflow with a number input",
    inputSchema: z.object({ number: z.number() }),
    execute: async ({ context: number, mastra }) => {
        // Get the workflow from Mastra instance
        const workflow = mastra?.getWorkflow("my-workflow");

        if (!workflow) {
            return "Workflow not found";
        }

        // Create and start a workflow run
        const { runId, start } = await workflow.createRun();
        const result = await start({
            triggerData: { inputValue: number }
        });

        return result.results;
    },
});
