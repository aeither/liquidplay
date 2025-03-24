import { Aptos, AptosConfig, Ed25519PrivateKey, type HexInput, Network, PrivateKey, PrivateKeyVariants } from "@aptos-labs/ts-sdk";
import { AgentRuntime, LocalSigner } from "move-agent-kit";
import { parseUnits } from "viem";


export const getWalletBalance = async () => {

    // Get private key from environment variable
    const privateKeyValue = process.env.PRIVATE_KEY;

    if (!privateKeyValue) {
        throw new Error('Private key is required but not found in environment variables');
    }

    // Setup Aptos configuration for MAINNET
    const aptosConfig = new AptosConfig({ network: Network.MAINNET });
    const aptos = new Aptos(aptosConfig);

    // Derive account from private key
    const account = await aptos.deriveAccountFromPrivateKey({
        privateKey: new Ed25519PrivateKey(
            PrivateKey.formatPrivateKey(privateKeyValue as HexInput, PrivateKeyVariants.Ed25519)
        ),
    });

    // Create signer and agent runtime
    const signer = new LocalSigner(account, Network.MAINNET);
    const agentRuntime = new AgentRuntime(signer, aptos);

    // Get balance
    const balance = await agentRuntime.getBalance();

    return {
        address: account.accountAddress.toString(),
        balance: balance.toString(),
        octasBalance: parseUnits(String(balance), 8).toString(),
        network: 'MAINNET',
    };
};