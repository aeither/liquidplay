import { mastra } from "@/mastra";
import { groq } from "@ai-sdk/groq";
import { generateObject } from "ai";

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const { messages } = await req.json();
  // Extract the last user message to determine the appropriate agent
  const lastUserMessage = messages[messages.length - 1].content[0].text;

  const { object } = await generateObject({
    model: groq('qwen-qwq-32b'),
    output: 'enum',
    enum: ['game', 'twitter', 'move', 'show'],
    prompt: lastUserMessage,
    system: `You are a planning assistant that determines which specialized agent would be most helpful for a user's query.
    
    Based on the user's request, you must decide which of the following predefined agent types would be most appropriate:
    
    - "twitter": For Twitter-related requests such as:
      * Analyzing Twitter activity for blockchain protocols
      * Searching tweets about specific topics
      * Getting tweets from specific accounts
      * Finding protocol-related tweets
    
    - "move": For Move blockchain protocol interactions such as:
      * Interacting with Amnis protocol (staking)
      * Interacting with Aries protocol (lending, borrowing, withdrawing)
      * Interacting with Joule Finance
      * Interacting with Thala protocol
      * Checking wallet balances
      * Creating protocol profiles

    - "show": For UI display requests such as:
      * Showing user profile information
      * Displaying UI components
      * Rendering interface elements
      * Presenting visual information to users

    - "game": For game-related requests such as:
      * Starting a game
      * Playing an interactive game
      * Getting game instructions or rules
      * Requesting game-related activities
    
    Your response should ONLY be a single string containing the most appropriate agent type: "twitter", "move", "knowledge", or "game".
    Do not include any other text in your response.`,
  });
  console.log('plan: ', object);

  if (object === 'move') {
    const myAgent = mastra.getAgent('moveAgent');
    const stream = await myAgent.stream(messages);
    return stream.toDataStreamResponse({ sendReasoning: false });
  }
  if (object === 'show') {
    const myAgent = mastra.getAgent('showProfileAgent');
    const stream = await myAgent.stream(messages);
    return stream.toDataStreamResponse({ sendReasoning: false });
  }
  if (object === 'twitter') {
    const myAgent = mastra.getAgent('twitterAgent');
    const stream = await myAgent.stream(messages);
    return stream.toDataStreamResponse({ sendReasoning: false });
  }

  const myAgent = mastra.getAgent('moveAgent');
  const stream = await myAgent.stream(messages);

  return stream.toDataStreamResponse({ sendReasoning: false });
}
