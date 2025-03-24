/**
 * Landing page with a retro terminal aesthetic
 * Full-screen hero page for the LiquidPlay application
 */
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "LiquidPlay | Gamified Liquidity Experience",
  description: "A gamified liquidity game using Twitter to fetch posts from Aptos protocols. Get scores and boost points by interacting with protocols.",
  keywords: ["LiquidPlay", "aptos", "liquidity game", "crypto game", "protocols", "points boost"],
  openGraph: {
    title: "LiquidPlay | Gamified Liquidity Experience",
    description: "A gamified liquidity game. Interact with Aptos protocols to earn points and climb the leaderboard.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <div className="h-dvh bg-black p-4 font-['Press_Start_2P',monospace] text-green-400 overflow-hidden border-4 border-green-500">
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <h1 className="text-4xl md:text-5xl mb-8 animate-pulse shadow-[0_0_15px_#22c55e]">
          LIQUIDPLAY
        </h1>

        <div className="inline-block border-2 border-green-500 p-6 shadow-[0_0_10px_#22c55e] bg-gray-900 mb-10 max-w-3xl w-full">
          <p className="mb-6 typing-effect text-sm md:text-base">INITIALIZING PROTOCOL DATABASE...</p>
          <p className="mb-6 text-sm md:text-base">GAMIFIED LIQUIDITY EXPERIENCE. EARN POINTS. CLIMB THE LEADERBOARD.</p>
          <p className="mb-8 text-sm md:text-base">
            INTERACT WITH APTOS PROTOCOLS TO BOOST YOUR MULTIPLIERS
          </p>

          <div className="flex flex-col md:flex-row justify-center gap-6 mt-8">
            <Link 
              href="/" 
              className="border-2 border-green-500 hover:bg-green-500/20 transition-colors px-8 py-4 text-xs md:text-sm"
            >
              ENTER TERMINAL
            </Link>
          </div>
        </div>

        <div className="text-xs opacity-70 fixed bottom-4">
          {/* biome-ignore lint/suspicious/noCommentText: <explanation> */}
          <p>VERSION 1.0.0 // SYSTEM ONLINE // AWAITING INPUT_</p>
          <div className="animate-pulse mt-2 h-1 w-3 bg-green-500 inline-block" />
        </div>
      </div>
    </div>
  );
}