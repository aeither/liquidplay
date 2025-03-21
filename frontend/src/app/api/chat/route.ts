import { groq } from "@ai-sdk/groq";
import { jsonSchema, streamText } from "ai";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, system, tools } = await req.json();

  const result = streamText({
    model: groq("qwen-qwq-32b"),
    messages,
    // forward system prompt and tools from the frontend
    system,
  });
  console.log("🚀 ~ POST ~ result:", result)

  return result.toDataStreamResponse();
}
