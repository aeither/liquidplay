"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { WebSearchToolUI } from "@/tools/WebSearchToolUI";
import {
  AssistantRuntimeProvider,
  CompositeAttachmentAdapter,
  SimpleImageAttachmentAdapter,
  SimpleTextAttachmentAdapter,
  WebSpeechSynthesisAdapter,
} from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";

export default function MyApp() {
	const runtime = useChatRuntime({
		api: "/api/chat",
		adapters: {
			speech: new WebSpeechSynthesisAdapter(),
			attachments: new CompositeAttachmentAdapter([
				new SimpleImageAttachmentAdapter(),
				new SimpleTextAttachmentAdapter(),
			]),
		},
	});

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<div className="grid h-dvh grid-cols-[200px_1fr] gap-x-2 px-4 py-4">
				<div className="bg-gray-900 p-4 rounded-2xl">
					<ThreadList />
				</div>
				<Thread />
				<WebSearchToolUI />
			</div>
		</AssistantRuntimeProvider>
	);
}
