
import { createLogger } from '@mastra/core/logger';
import { Mastra } from '@mastra/core/mastra';
import { moveAgent, twitterAgent } from './agents';
import { weatherWorkflow } from './workflows';

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { moveAgent, twitterAgent },
  logger: createLogger({
    name: 'Mastra',
    level: 'info',
  }),
});
