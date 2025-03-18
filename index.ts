import * as dotenv from "dotenv";
import {
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  HexInput,
  Network,
  PrivateKey,
  PrivateKeyVariants,
} from "@aptos-labs/ts-sdk";
import { AgentRuntime, LocalSigner, createAptosTools } from "move-agent-kit";

// Load environment variables
dotenv.config();

async function main() {
  try {
    console.log("Initializing Move Agent...");
    
    // Check for environment variables
    if (!process.env.APTOS_PRIVATE_KEY) {
      throw new Error("Missing APTOS_PRIVATE_KEY in environment variables");
    }

    // 1. Basic Setup
    const aptosConfig = new AptosConfig({
      network: Network.MAINNET,
    });

    const aptos = new Aptos(aptosConfig);

    const account = await aptos.deriveAccountFromPrivateKey({
      privateKey: new Ed25519PrivateKey(
        PrivateKey.formatPrivateKey(
          process.env.APTOS_PRIVATE_KEY,
          PrivateKeyVariants.Ed25519,
        ),
      ),
    });

    console.log("Account address:", account.accountAddress.toString());

    // 3. Initialize the Client
    const signer = new LocalSigner(account, Network.MAINNET);
    const agent = new AgentRuntime(signer, aptos, {
      PANORA_API_KEY: process.env.PANORA_API_KEY, // optional
      OPENAI_API_KEY: process.env.OPENAI_API_KEY // optional
    });
    
    const tools = createAptosTools(agent);
    
    console.log("Agent initialized successfully!");
    
    // Commented out examples based on documentation
    
    // // Token Transfer
    // const result = await agent.transferTokens("0xRECIPIENT_ADDRESS", 1.0);
    // console.log("Transfer result:", result);
    
    // // Get Balance
    // const balance = await agent.getBalance("0xADDRESS");
    // console.log("Balance:", balance);
    
    // // Get Transaction Info
    // const txInfo = await agent.getTransactionInfo("0xTRANSACTION_HASH");
    // console.log("Transaction info:", txInfo);
    
    console.log("Setup complete. Uncomment the examples to test functionality.");
    
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
