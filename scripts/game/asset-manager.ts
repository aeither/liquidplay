import {
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  Network,
  PrivateKey,
  PrivateKeyVariants,
} from "@aptos-labs/ts-sdk";
import dotenv from 'dotenv';
import * as fs from 'fs';
import { AgentRuntime, LocalSigner } from "move-agent-kit";
import * as path from 'path';
import type { GameAction, GameStrategy } from './strategy-optimizer';

dotenv.config();

// Define types for asset manager
interface AssetInventory {
  gameId: string;
  assets: {
    assetId: string;
    name: string;
    quantity: number;
    lastKnownValue: number;
    acquisitionDate: number;
    acquisitionPrice: number;
  }[];
}

interface TransactionRecord {
  id: string;
  gameId: string;
  actionType: string;
  description: string;
  assets: string[];
  value: number;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  hash?: string;
  strategyId?: string;
}

interface AssetManagerState {
  inventory: Record<string, AssetInventory>;
  transactions: TransactionRecord[];
  balance: number;
}

// Asset Manager class
export class AssetManager {
  private aptos: Aptos;
  private agent: AgentRuntime;
  private state: AssetManagerState;
  private dataDir: string;
  
  // Game-specific module addresses and entry functions
  private gameModules: Record<string, {
    moduleAddress: string;
    functions: Record<string, string>;
  }> = {
    'aptos_knights': {
      moduleAddress: '0x123456', // Example module address
      functions: {
        'farm_resources': 'farm_resources',
        'craft_item': 'craft_item',
        'sell_item': 'sell_item',
        'buy_item': 'buy_item',
      }
    },
    'crypto_racers': {
      moduleAddress: '0x234567', // Example module address
      functions: {
        'enter_tournament': 'enter_race',
        'upgrade_car': 'upgrade_car',
        'buy_car': 'buy_car',
        'sell_car': 'sell_car',
      }
    },
    'aptos_lands': {
      moduleAddress: '0x345678', // Example module address
      functions: {
        'develop_land': 'develop_land',
        'collect_rent': 'collect_rent',
        'buy_land': 'buy_land',
        'sell_land': 'sell_land',
      }
    }
  };

  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    // Initialize or load state
    this.state = this.loadState();
    
    // Initialize Aptos client
    const aptosConfig = new AptosConfig({
      network: Network.TESTNET, // Use testnet for hackathon demo
    });
    
    this.aptos = new Aptos(aptosConfig);
  }

  private loadState(): AssetManagerState {
    const statePath = path.join(this.dataDir, 'asset-manager-state.json');
    
    if (fs.existsSync(statePath)) {
      try {
        return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
      } catch (error) {
        console.error('Error loading asset manager state:', error);
      }
    }
    
    // Return default state if no file exists or error occurred
    return {
      inventory: {
        'aptos_knights': {
          gameId: 'aptos_knights',
          assets: [
            {
              assetId: 'basic_tools',
              name: 'Basic Tools',
              quantity: 1,
              lastKnownValue: 0.05,
              acquisitionDate: Date.now(),
              acquisitionPrice: 0.05,
            }
          ]
        },
        'crypto_racers': {
          gameId: 'crypto_racers',
          assets: [
            {
              assetId: 'race_car',
              name: 'Basic Race Car',
              quantity: 1,
              lastKnownValue: 0.2,
              acquisitionDate: Date.now(),
              acquisitionPrice: 0.2,
            }
          ]
        },
        'aptos_lands': {
          gameId: 'aptos_lands',
          assets: [
            {
              assetId: 'land_plot',
              name: 'Small Land Plot',
              quantity: 1,
              lastKnownValue: 0.5,
              acquisitionDate: Date.now(),
              acquisitionPrice: 0.5,
            }
          ]
        }
      },
      transactions: [],
      balance: 5.0, // Initial balance in APT
    };
  }

  private saveState(): void {
    const statePath = path.join(this.dataDir, 'asset-manager-state.json');
    
    try {
      fs.writeFileSync(statePath, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('Error saving asset manager state:', error);
    }
  }

  async initialize(): Promise<void> {
    // Check if required environment variables are defined
    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY must be set in .env file');
    }

    console.log('Initializing Asset Manager...');
    
    try {
      // Get account from private key
      const account = await this.aptos.deriveAccountFromPrivateKey({
        privateKey: new Ed25519PrivateKey(
          PrivateKey.formatPrivateKey(
            process.env.PRIVATE_KEY,
            PrivateKeyVariants.Ed25519,
          ),
        ),
      });
      
      console.log(`Account address: ${account.accountAddress.toString()}`);
      
      // Initialize the Client
      const signer = new LocalSigner(account, Network.TESTNET);
      this.agent = new AgentRuntime(signer, this.aptos, {
        // Optional API keys
        // OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        // ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      });
      
      console.log('Asset Manager initialized successfully');
    } catch (error) {
      console.error('Error initializing Asset Manager:', error);
      throw error;
    }
  }

  // Execute a strategy by performing its actions
  async executeStrategy(strategy: GameStrategy): Promise<number> {
    console.log(`Executing strategy: ${strategy.name}`);
    
    let successCount = 0;
    const totalActions = strategy.actions.length;
    
    // Execute each action in the strategy
    for (const action of strategy.actions) {
      try {
        console.log(`Executing action: ${action.actionType}`);
        
        // Check if we have the required assets
        const hasRequiredAssets = this.checkRequiredAssets(strategy.gameId, strategy.requiredAssets);
        
        if (!hasRequiredAssets) {
          console.log(`Missing required assets for strategy ${strategy.name}`);
          continue;
        }
        
        // Execute the action
        const success = await this.executeGameAction(action, strategy.id);
        
        if (success) {
          successCount++;
        }
      } catch (error) {
        console.error(`Error executing action ${action.actionType}:`, error);
      }
    }
    
    // Calculate performance as percentage of successful actions
    const performance = (successCount / totalActions) * 100;
    console.log(`Strategy execution complete. Performance: ${performance}%`);
    
    return performance;
  }

  private checkRequiredAssets(gameId: string, requiredAssets: string[]): boolean {
    // If no assets required, return true
    if (!requiredAssets || requiredAssets.length === 0) {
      return true;
    }
    
    // Check if we have all required assets
    const inventory = this.state.inventory[gameId];
    
    if (!inventory) {
      return false;
    }
    
    for (const assetId of requiredAssets) {
      const hasAsset = inventory.assets.some(
        asset => asset.assetId === assetId && asset.quantity > 0
      );
      
      if (!hasAsset) {
        return false;
      }
    }
    
    return true;
  }

  private async executeGameAction(action: GameAction, strategyId?: string): Promise<boolean> {
    // Check if we support this game
    const gameModule = this.gameModules[action.gameId];
    
    if (!gameModule) {
      console.log(`Game ${action.gameId} not supported`);
      return false;
    }
    
    // Check if we support this action type
    const functionName = gameModule.functions[action.actionType];
    
    if (!functionName) {
      console.log(`Action type ${action.actionType} not supported for game ${action.gameId}`);
      return false;
    }
    
    // Create a transaction record
    const transactionId = `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const transaction: TransactionRecord = {
      id: transactionId,
      gameId: action.gameId,
      actionType: action.actionType,
      description: action.expectedOutcome,
      assets: [],
      value: 0,
      timestamp: Date.now(),
      status: 'pending',
      strategyId,
    };
    
    // Add transaction to state
    this.state.transactions.push(transaction);
    this.saveState();
    
    try {
      let success = false;
      
      // Execute action based on type
      switch (action.actionType) {
        case 'farm_resources':
          success = await this.executeFarmResources(action, transaction);
          break;
          
        case 'sell_assets':
          success = await this.executeSellAssets(action, transaction);
          break;
          
        case 'enter_tournament':
          success = await this.executeEnterTournament(action, transaction);
          break;
          
        case 'develop_land':
          success = await this.executeDevelopLand(action, transaction);
          break;
          
        default:
          // For unsupported action types, simulate success/failure
          success = Math.random() > 0.2; // 80% success rate
          
          // Update transaction
          transaction.status = success ? 'confirmed' : 'failed';
          transaction.value = success ? 0.1 : 0;
          this.saveState();
      }
      
      return success;
    } catch (error) {
      console.error(`Error executing ${action.actionType}:`, error);
      
      // Update transaction status
      transaction.status = 'failed';
      this.saveState();
      
      return false;
    }
  }

  // Simulation of farming resources (in a real implementation, this would call the blockchain)
  private async executeFarmResources(action: GameAction, transaction: TransactionRecord): Promise<boolean> {
    console.log(`Farming resources in ${action.gameId}...`);
    console.log(`Parameters: ${JSON.stringify(action.parameters)}`);
    
    // Simulate blockchain call by waiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate success/failure
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      // Simulate resources gained
      const resources = action.parameters.resourceTypes as string[];
      const resourcesGained: {assetId: string, name: string, quantity: number}[] = [];
      
      for (const resource of resources) {
        const quantity = Math.floor(Math.random() * 10) + 1; // 1-10 units
        const assetId = `${resource}`;
        const name = `${resource.charAt(0).toUpperCase() + resource.slice(1)}`;
        
        resourcesGained.push({
          assetId,
          name,
          quantity,
        });
      }
      
      // Add resources to inventory
      for (const resource of resourcesGained) {
        this.addAssetToInventory(
          action.gameId,
          resource.assetId,
          resource.name,
          resource.quantity,
          0.01 // Nominal value per unit
        );
        
        transaction.assets.push(resource.assetId);
      }
      
      // Update transaction
      transaction.status = 'confirmed';
      transaction.value = resourcesGained.length * 0.01 * 5; // Estimated value
      this.saveState();
      
      console.log(`Farming successful! Gained ${resourcesGained.map(r => `${r.quantity} ${r.name}`).join(', ')}`);
    } else {
      // Update transaction
      transaction.status = 'failed';
      this.saveState();
      
      console.log('Farming failed!');
    }
    
    return success;
  }

  // Simulation of selling assets
  private async executeSellAssets(action: GameAction, transaction: TransactionRecord): Promise<boolean> {
    console.log(`Selling assets in ${action.gameId}...`);
    console.log(`Parameters: ${JSON.stringify(action.parameters)}`);
    
    // Find assets to sell (those that have increased in price by the specified percentage)
    const minPriceIncrease = action.parameters.minPriceIncrease || 10;
    const inventory = this.state.inventory[action.gameId];
    
    if (!inventory || inventory.assets.length === 0) {
      console.log('No assets to sell');
      transaction.status = 'failed';
      this.saveState();
      return false;
    }
    
    // Find assets that have appreciated enough
    const assetsToSell = inventory.assets.filter(asset => {
      const priceIncrease = ((asset.lastKnownValue - asset.acquisitionPrice) / asset.acquisitionPrice) * 100;
      return priceIncrease >= minPriceIncrease;
    });
    
    if (assetsToSell.length === 0) {
      console.log('No assets have appreciated enough to sell');
      transaction.status = 'failed';
      this.saveState();
      return false;
    }
    
    // Simulate blockchain call by waiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate success/failure
    const success = Math.random() > 0.2; // 80% success rate
    
    if (success) {
      // Calculate total sale value
      let totalValue = 0;
      
      for (const asset of assetsToSell) {
        totalValue += asset.lastKnownValue * asset.quantity;
        transaction.assets.push(asset.assetId);
        
        // Remove asset from inventory
        this.removeAssetFromInventory(action.gameId, asset.assetId, asset.quantity);
      }
      
      // Add value to balance
      this.state.balance += totalValue;
      
      // Update transaction
      transaction.status = 'confirmed';
      transaction.value = totalValue;
      this.saveState();
      
      console.log(`Sold ${assetsToSell.length} assets for ${totalValue.toFixed(4)} APT`);
    } else {
      // Update transaction
      transaction.status = 'failed';
      this.saveState();
      
      console.log('Sale failed!');
    }
    
    return success;
  }

  // Simulation of entering a tournament
  private async executeEnterTournament(action: GameAction, transaction: TransactionRecord): Promise<boolean> {
    console.log(`Entering tournament in ${action.gameId}...`);
    console.log(`Parameters: ${JSON.stringify(action.parameters)}`);
    
    // Check if we have enough balance for entry fee
    const entryFee = action.parameters.entryFee || 'max_0.1_apt';
    const maxFee = Number.parseFloat(entryFee.split('_')[1]) || 0.1;
    
    if (this.state.balance < maxFee) {
      console.log(`Insufficient balance (${this.state.balance} APT) for entry fee (${maxFee} APT)`);
      transaction.status = 'failed';
      this.saveState();
      return false;
    }
    
    // Simulate blockchain call by waiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Deduct entry fee
    this.state.balance -= maxFee;
    
    // Simulate success/failure (tournament result)
    const result = Math.random();
    let prize = 0;
    
    if (result < 0.1) {
      // 10% chance of winning 1st prize (5x entry fee)
      prize = maxFee * 5;
      console.log(`Won 1st place! Prize: ${prize.toFixed(4)} APT`);
    } else if (result < 0.3) {
      // 20% chance of winning 2nd prize (2x entry fee)
      prize = maxFee * 2;
      console.log(`Won 2nd place! Prize: ${prize.toFixed(4)} APT`);
    } else if (result < 0.5) {
      // 20% chance of winning 3rd prize (1.5x entry fee)
      prize = maxFee * 1.5;
      console.log(`Won 3rd place! Prize: ${prize.toFixed(4)} APT`);
    } else {
      // 50% chance of not winning
      console.log('Did not win any prize');
    }
    
    // Add prize to balance
    this.state.balance += prize;
    
    // Update transaction
    transaction.status = 'confirmed';
    transaction.value = prize - maxFee; // Net value (can be negative)
    this.saveState();
    
    return prize > 0;
  }

  // Simulation of developing land
  private async executeDevelopLand(action: GameAction, transaction: TransactionRecord): Promise<boolean> {
    console.log(`Developing land in ${action.gameId}...`);
    console.log(`Parameters: ${JSON.stringify(action.parameters)}`);
    
    // Parse investment amount
    const investment = action.parameters.investment || 'max_0.5_apt';
    const maxInvestment = Number.parseFloat(investment.split('_')[1]) || 0.5;
    
    // Check if we have enough balance
    if (this.state.balance < maxInvestment) {
      console.log(`Insufficient balance (${this.state.balance} APT) for investment (${maxInvestment} APT)`);
      transaction.status = 'failed';
      this.saveState();
      return false;
    }
    
    // Simulate blockchain call by waiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Deduct investment
    this.state.balance -= maxInvestment;
    
    // Simulate success/failure
    const success = Math.random() > 0.15; // 85% success rate
    
    if (success) {
      // Create a new asset (building) in inventory
      const buildingType = action.parameters.buildingType || 'resource_generator';
      const buildingId = `${buildingType}_${Date.now()}`;
      const buildingName = buildingType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      this.addAssetToInventory(
        action.gameId,
        buildingId,
        buildingName,
        1,
        maxInvestment * 1.2 // Building is worth more than investment
      );
      
      transaction.assets.push(buildingId);
      
      // Update transaction
      transaction.status = 'confirmed';
      transaction.value = maxInvestment * 0.2; // Immediate appreciation
      this.saveState();
      
      console.log(`Successfully built ${buildingName}!`);
    } else {
      // Update transaction
      transaction.status = 'failed';
      transaction.value = -maxInvestment; // Lost investment
      this.saveState();
      
      console.log('Development failed!');
    }
    
    return success;
  }

  // Helper to add asset to inventory
  private addAssetToInventory(
    gameId: string,
    assetId: string,
    name: string,
    quantity: number,
    valuePerUnit: number
  ): void {
    // Ensure game inventory exists
    if (!this.state.inventory[gameId]) {
      this.state.inventory[gameId] = {
        gameId,
        assets: [],
      };
    }
    
    // Check if asset already exists
    const existingAsset = this.state.inventory[gameId].assets.find(
      asset => asset.assetId === assetId
    );
    
    if (existingAsset) {
      // Update existing asset
      existingAsset.quantity += quantity;
      existingAsset.lastKnownValue = valuePerUnit;
    } else {
      // Add new asset
      this.state.inventory[gameId].assets.push({
        assetId,
        name,
        quantity,
        lastKnownValue: valuePerUnit,
        acquisitionDate: Date.now(),
        acquisitionPrice: valuePerUnit,
      });
    }
    
    this.saveState();
  }

  // Helper to remove asset from inventory
  private removeAssetFromInventory(
    gameId: string,
    assetId: string,
    quantity: number
  ): void {
    // Ensure game inventory exists
    if (!this.state.inventory[gameId]) {
      return;
    }
    
    // Find asset
    const assetIndex = this.state.inventory[gameId].assets.findIndex(
      asset => asset.assetId === assetId
    );
    
    if (assetIndex === -1) {
      return;
    }
    
    const asset = this.state.inventory[gameId].assets[assetIndex];
    
    // Update quantity
    asset.quantity -= quantity;
    
    // Remove asset if quantity is 0 or less
    if (asset.quantity <= 0) {
      this.state.inventory[gameId].assets.splice(assetIndex, 1);
    }
    
    this.saveState();
  }

  // Get current inventory
  getInventory(): Record<string, AssetInventory> {
    return this.state.inventory;
  }
  
  // Get inventory for a specific game
  getGameInventory(gameId: string): AssetInventory | null {
    return this.state.inventory[gameId] || null;
  }
  
  // Get all transactions
  getTransactions(): TransactionRecord[] {
    return this.state.transactions;
  }
  
  // Get most recent transactions
  getRecentTransactions(limit = 10): TransactionRecord[] {
    return this.state.transactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
  
  // Get current balance
  getBalance(): number {
    return this.state.balance;
  }
  
  // Calculate portfolio value
  getPortfolioValue(): number {
    let totalValue = this.state.balance;
    
    // Add value of all assets
    for (const inventory of Object.values(this.state.inventory)) {
      for (const asset of inventory.assets) {
        totalValue += asset.lastKnownValue * asset.quantity;
      }
    }
    
    return totalValue;
  }
}

// Example usage
async function main() {
  try {
    const assetManager = new AssetManager();
    await assetManager.initialize();
    
    console.log('\nCurrent Balance:', assetManager.getBalance(), 'APT');
    console.log('Portfolio Value:', assetManager.getPortfolioValue(), 'APT');
    
    console.log('\nCurrent Inventory:');
    const inventory = assetManager.getInventory();
    
    for (const [gameId, gameInventory] of Object.entries(inventory)) {
      console.log(`\n${gameId}:`);
      
      if (gameInventory.assets.length === 0) {
        console.log('  No assets');
        continue;
      }
      
      for (const asset of gameInventory.assets) {
        console.log(`  ${asset.name} x${asset.quantity} (${asset.lastKnownValue} APT each)`);
      }
    }
    
    // Simulate executing a strategy
    console.log('\nSimulating strategy execution...');
    
    // Mock strategy
    const mockStrategy = {
      id: 'mock_strategy',
      name: 'Test Resource Farming',
      gameId: 'aptos_knights',
      description: 'Test resource farming strategy',
      actions: [
        {
          actionType: 'farm_resources',
          gameId: 'aptos_knights',
          parameters: {
            resourceTypes: ['wood', 'stone', 'gold'],
            duration: 2,
            location: 'forest',
          },
          expectedOutcome: 'Gather resources during test',
          priorityScore: 80,
          riskLevel: 'low',
        }
      ],
      estimatedROI: 15,
      requiredAssets: ['basic_tools'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'active',
    };
    
    const performance = await assetManager.executeStrategy(mockStrategy);
    
    console.log('\nStrategy Performance:', performance, '%');
    console.log('New Balance:', assetManager.getBalance(), 'APT');
    console.log('New Portfolio Value:', assetManager.getPortfolioValue(), 'APT');
    
    console.log('\nRecent Transactions:');
    const transactions = assetManager.getRecentTransactions(5);
    
    for (const tx of transactions) {
      console.log(`  ${tx.actionType} - ${tx.status} - Value: ${tx.value} APT`);
    }
  } catch (error) {
    console.error('Error in asset manager:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}
