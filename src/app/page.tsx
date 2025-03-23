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
      <div className="h-dvh bg-black p-4 font-['Press_Start_2P',monospace] text-green-400 overflow-hidden border-4 border-green-500">
        <div className="grid grid-cols-[250px_1fr] gap-x-4 h-full">
          <div className="bg-gray-900 p-4 rounded-md border-2 border-green-500 shadow-[0_0_10px_#22c55e] flex flex-col h-full">
            <div className="mb-4 text-center border-b-2 border-green-500 pb-2 flex-shrink-0">
              <h2 className="text-md tracking-wider animate-pulse">
                GAME MENU
              </h2>
            </div>
            <div className="overflow-y-auto flex-1 h-0 min-h-0 pr-2 custom-scrollbar">
              <ThreadList />
            </div>
          </div>
          <div className="flex flex-col h-full">
            <div className="bg-gray-900 p-4 rounded-md border-2 border-green-500 mb-4 flex-grow flex flex-col shadow-[0_0_10px_#22c55e] h-0 min-h-0">
              <div className="mb-4 text-center border-b-2 border-green-500 pb-2 flex-shrink-0">
                <h2 className="text-md tracking-wider">CONSOLE OUTPUT</h2>
              </div>
              <div className="overflow-y-auto flex-1 h-0 min-h-0 pr-2 custom-scrollbar">
                <Thread />
              </div>
            </div>
            <div className="bg-gray-900 p-3 rounded-md border-2 border-green-500 shadow-[0_0_10px_#22c55e] flex-shrink-0">
              <WebSearchToolUI />
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        body {
          background-color: #000;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        
        /* Custom scrollbar styling */
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #111;
          border: 1px solid #22c55e;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #22c55e;
          border-radius: 2px;
        }
        
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #22c55e #111;
        }
        
        /* CRT screen effect */
        .h-dvh::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
          background-size: 100% 4px;
          pointer-events: none;
          z-index: 10;
        }
        
        /* Scanline effect */
        .h-dvh::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(32, 128, 32, 0.1);
          pointer-events: none;
          z-index: 11;
        }
        
        /* Button styling */
        button {
          background-color: #333 !important;
          border: 2px solid #22c55e !important;
          color: #22c55e !important;
          font-family: 'Press Start 2P', monospace !important;
          text-transform: uppercase !important;
          padding: 8px 16px !important;
          transition: all 0.2s !important;
          box-shadow: 0 0 6px #22c55e !important;
        }
        
        button:hover {
          background-color: #22c55e !important;
          color: #000 !important;
          transform: scale(1.05) !important;
        }
        
        /* Input styling */
        input, textarea {
          background-color: #111 !important;
          border: 2px solid #22c55e !important;
          color: #22c55e !important;
          font-family: 'Press Start 2P', monospace !important;
          padding: 8px !important;
          box-shadow: 0 0 6px #22c55e inset !important;
        }
        
        /* Message styling */
        .retro-text div {
          margin-bottom: 15px;
          padding: 10px;
          border: 1px solid #22c55e;
          background-color: rgba(34, 197, 94, 0.1);
          border-radius: 4px;
        }
        
        /* Blinking cursor effect */
        .retro-search::after {
          content: "_";
          animation: blink 1s step-end infinite;
        }
        
        @keyframes blink {
          50% { opacity: 0; }
        }
      `}</style>
    </AssistantRuntimeProvider>
  );
}
