import { mastra } from "@/mastra";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const myAgent = mastra.getAgent('moveAgent');
  const stream = await myAgent.stream(messages);

  return stream.toDataStreamResponse({ sendReasoning: false });
}
