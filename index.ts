import {
  Aptos,
  AptosConfig,
  Network,
} from "@aptos-labs/ts-sdk";
import { CASTController } from './cast-controller';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configure Aptos client
const aptosConfig = new AptosConfig({
  network: Network.TESTNET,
  // Ensure we use HTTP/1.1 to avoid HTTP/2 issues on some networks
  clientConfig: { 
    FETCH_OPTIONS: { headers: { 'accept-encoding': 'gzip' } } 
  }
});

const aptos = new Aptos(aptosConfig);

async function main() {
  try {
    console.log("🎮 Starting CAST: Crypto Asset Strategy Tactician 🎮");
    console.log("Your AI-powered GameFi agent for the Aptos ecosystem");
    console.log("---------------------------------------------------");
    
    // Initialize and run the CAST system
    const cast = new CASTController();
    await cast.initialize();
    
    // Run a single optimization cycle
    await cast.runCycle();
    
    console.log("\n✅ Initial cycle completed!");
    console.log("📊 Check the 'data' folder for performance reports and strategy data");
    console.log("🚀 Run the agent with longer intervals by modifying the auto-cycle settings");
    
    // Uncomment to enable continuous auto-cycles:
    // cast.startAutoCycles(30); // Run every 30 minutes
    
  } catch (error) {
    console.error("🔴 Error starting CAST:", error);
    process.exit(1);
  }
}

// Execute main function
main().catch(console.error);