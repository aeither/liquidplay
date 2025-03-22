import { openai } from "@ai-sdk/openai";
import { Mastra } from "@mastra/core";
import { Agent } from "@mastra/core/agent";
import { Step, Workflow } from "@mastra/core/workflows";
import { z } from "zod";

// Create a workflow
const myWorkflow = new Workflow({
    name: 'my-workflow',
    triggerSchema: z.object({
        inputValue: z.number(),
    }),
});

// Define workflow steps
const stepOne = new Step({
    id: 'stepOne',
    outputSchema: z.object({
        doubledValue: z.number(),
    }),
    execute: async ({ context }) => {
        const doubledValue = context.triggerData.inputValue * 2;
        return { doubledValue };
    },
});

// Link steps and commit workflow
myWorkflow.step(stepOne).commit();
