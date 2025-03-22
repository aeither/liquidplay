import { GameIntelligenceSystem } from './game-intelligence';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

// Define types for strategies
interface GameAction {
  actionType: string;
  gameId: string;
  parameters: Record<string, any>;
  expectedOutcome: string;
  priorityScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface GameStrategy {
  id: string;
  name: string;
  gameId: string;
  description: string;
  actions: GameAction[];
  estimatedROI: number;
  requiredAssets: string[];
  createdAt: number;
  updatedAt: number;
  lastExecutedAt?: number;
  lastPerformance?: number; // Percentage of expected outcome achieved
  status: 'active' | 'inactive' | 'testing';
}

interface StrategyOptimizerState {
  strategies: Record<string, GameStrategy>;
  gamePerformanceHistory: Record<string, {
    gameId: string;
    timestamp: number;
    actions: GameAction[];
    expectedOutcome: number;
    actualOutcome: number;
  }[]>;
}

// Strategy Optimizer class
export class StrategyOptimizer {
  private gameIntelligence: GameIntelligenceSystem;
  private state: StrategyOptimizerState;
  private dataDir: string;
  
  // Strategy generation rules
  private actionRules: Record<string, { 
    gameId: string, 
    triggerConditions: Record<string, any>,
    actionTemplate: Partial<GameAction>
  }[]> = {
    'resource_farming': [
      {
        gameId: 'aptos_knights',
        triggerConditions: {
          eventTypes: ['update', 'promotion'],
          minPlayerActivity: 30,
        },
        actionTemplate: {
          actionType: 'farm_resources',
          parameters: {
            resourceTypes: ['wood', 'stone', 'gold'],
            duration: 2, // hours
            location: 'forest',
          },
          expectedOutcome: 'Gather resources during high-activity periods',
          riskLevel: 'low',
        }
      }
    ],
    'asset_trading': [
      {
        gameId: 'aptos_knights',
        triggerConditions: {
          assetPriceChange: 10, // percentage
          minAssetCount: 3,
        },
        actionTemplate: {
          actionType: 'sell_assets',
          parameters: {
            marketplace: 'in_game',
            minPriceIncrease: 15, // percentage
          },
          expectedOutcome: 'Sell assets when prices peak',
          riskLevel: 'medium',
        }
      }
    ],
    'competition_entry': [
      {
        gameId: 'crypto_racers',
        triggerConditions: {
          eventTypes: ['tournament'],
          minRelevanceScore: 50,
        },
        actionTemplate: {
          actionType: 'enter_tournament',
          parameters: {
            carClass: 'best_available',
            entryFee: 'max_0.1_apt',
          },
          expectedOutcome: 'Participate in high-reward tournaments',
          riskLevel: 'medium',
        }
      }
    ],
    'land_development': [
      {
        gameId: 'aptos_lands',
        triggerConditions: {
          assetType: 'land',
          minPlayerActivity: 60,
        },
        actionTemplate: {
          actionType: 'develop_land',
          parameters: {
            buildingType: 'resource_generator',
            investment: 'max_0.5_apt',
          },
          expectedOutcome: 'Generate passive income from land',
          riskLevel: 'medium',
        }
      }
    ],
  };

  constructor(gameIntelligence: GameIntelligenceSystem) {
    this.gameIntelligence = gameIntelligence;
    this.dataDir = path.join(process.cwd(), 'data');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    // Initialize or load state
    this.state = this.loadState();
  }

  private loadState(): StrategyOptimizerState {
    const statePath = path.join(this.dataDir, 'strategy-state.json');
    
    if (fs.existsSync(statePath)) {
      try {
        return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
      } catch (error) {
        console.error('Error loading strategy state:', error);
      }
    }
    
    // Return default state if no file exists or error occurred
    return {
      strategies: {},
      gamePerformanceHistory: {},
    };
  }

  private saveState(): void {
    const statePath = path.join(this.dataDir, 'strategy-state.json');
    
    try {
      fs.writeFileSync(statePath, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('Error saving strategy state:', error);
    }
  }

  // Generate strategies based on current game intelligence
  async generateStrategies(): Promise<GameStrategy[]> {
    console.log('Generating optimal gaming strategies...');
    const gameState = this.gameIntelligence.getGameState();
    const newStrategies: GameStrategy[] = [];
    
    // For each game, generate applicable strategies
    for (const [gameId, game] of Object.entries(gameState.games)) {
      console.log(`Analyzing ${game.name} for strategy opportunities...`);
      
      // Check each strategy type
      for (const [strategyType, rules] of Object.entries(this.actionRules)) {
        // Find applicable rules for this game
        const gameRules = rules.filter(rule => rule.gameId === gameId);
        
        for (const rule of gameRules) {
          // Check if trigger conditions are met
          const shouldTrigger = this.evaluateTriggerConditions(rule.triggerConditions, game);
          
          if (shouldTrigger) {
            // Generate a new strategy based on the template
            const strategy = this.createStrategyFromTemplate(strategyType, gameId, rule.actionTemplate);
            newStrategies.push(strategy);
            
            // Add to state
            this.state.strategies[strategy.id] = strategy;
          }
        }
      }
    }
    
    // Save updated state
    this.saveState();
    
    console.log(`Generated ${newStrategies.length} new strategies.`);
    return newStrategies;
  }

  private evaluateTriggerConditions(conditions: Record<string, any>, gameData: any): boolean {
    // Evaluate each condition
    for (const [condition, value] of Object.entries(conditions)) {
      switch (condition) {
        case 'eventTypes':
          // Check if any current events match the specified types
          const eventTypesMatch = gameData.currentEvents.some(
            (event: any) => value.includes(event.eventType)
          );
          if (!eventTypesMatch) return false;
          break;
          
        case 'minPlayerActivity':
          // Check if player activity meets minimum threshold
          if (gameData.playerActivity < value) return false;
          break;
          
        case 'assetPriceChange':
          // Check if any assets have price changes exceeding threshold
          const assetsWithPriceChange = Object.values(gameData.assets).filter(
            (asset: any) => {
              if (!asset.priceHistory || asset.priceHistory.length < 2) return false;
              
              const latestPrice = asset.lastKnownPrice || 0;
              const previousPrice = asset.priceHistory[asset.priceHistory.length - 2].price;
              const change = Math.abs((latestPrice - previousPrice) / previousPrice * 100);
              
              return change >= value;
            }
          );
          if (assetsWithPriceChange.length === 0) return false;
          break;
          
        case 'minAssetCount':
          // Check if we know of enough assets
          if (Object.keys(gameData.assets).length < value) return false;
          break;
          
        case 'minRelevanceScore':
          // Check if any events have relevance score above threshold
          const relevantEvents = gameData.currentEvents.filter(
            (event: any) => event.relevanceScore >= value
          );
          if (relevantEvents.length === 0) return false;
          break;
          
        case 'assetType':
          // Check if we have assets of the specified type
          const matchingAssets = Object.values(gameData.assets).filter(
            (asset: any) => asset.type === value
          );
          if (matchingAssets.length === 0) return false;
          break;
      }
    }
    
    // If we get here, all conditions passed
    return true;
  }

  private createStrategyFromTemplate(
    strategyType: string, 
    gameId: string, 
    actionTemplate: Partial<GameAction>
  ): GameStrategy {
    const now = Date.now();
    const gameData = this.gameIntelligence.getGameData(gameId);
    
    // Create a unique ID
    const id = `${strategyType}_${gameId}_${now}`;
    
    // Create actions based on the template
    const actions: GameAction[] = [{
      actionType: actionTemplate.actionType || 'unknown',
      gameId,
      parameters: actionTemplate.parameters || {},
      expectedOutcome: actionTemplate.expectedOutcome || 'Improve game performance',
      priorityScore: this.calculatePriorityScore(actionTemplate, gameData),
      riskLevel: actionTemplate.riskLevel || 'medium',
    }];
    
    // Create the strategy
    const strategy: GameStrategy = {
      id,
      name: this.generateStrategyName(strategyType, gameId),
      gameId,
      description: this.generateStrategyDescription(strategyType, gameId, actionTemplate),
      actions,
      estimatedROI: this.estimateROI(strategyType, gameId, actions),
      requiredAssets: this.determineRequiredAssets(gameId, actionTemplate),
      createdAt: now,
      updatedAt: now,
      status: 'active',
    };
    
    return strategy;
  }

  private calculatePriorityScore(actionTemplate: Partial<GameAction>, gameData: any): number {
    // Calculate priority based on various factors
    let score = 50; // Base score
    
    // Adjust based on action type
    switch (actionTemplate.actionType) {
      case 'farm_resources':
        score += gameData.playerActivity / 2; // Higher activity = higher score
        break;
        
      case 'sell_assets':
        score += 30; // Selling at profit is high priority
        break;
        
      case 'enter_tournament':
        // Check if there are tournament events
        const tournamentEvents = gameData.currentEvents.filter(
          (event: any) => event.eventType === 'tournament'
        );
        score += tournamentEvents.length * 10;
        break;
        
      case 'develop_land':
        score += 20; // Long-term investment
        break;
    }
    
    // Adjust based on risk level
    switch (actionTemplate.riskLevel) {
      case 'low':
        score += 10;
        break;
      case 'medium':
        // No adjustment
        break;
      case 'high':
        score -= 10;
        break;
    }
    
    // Ensure score is within bounds
    return Math.max(0, Math.min(100, score));
  }

  private generateStrategyName(strategyType: string, gameId: string): string {
    const gameName = this.gameIntelligence.getGameData(gameId).name;
    
    const strategyNames: Record<string, string[]> = {
      'resource_farming': [
        `${gameName} Resource Harvester`,
        `${gameName} Efficient Farmer`,
        `${gameName} Resource Optimization`,
      ],
      'asset_trading': [
        `${gameName} Market Tactician`,
        `${gameName} Asset Flipper`,
        `${gameName} Peak Seller`,
      ],
      'competition_entry': [
        `${gameName} Tournament Pro`,
        `${gameName} Championship Strategy`,
        `${gameName} Competition Optimizer`,
      ],
      'land_development': [
        `${gameName} Land Baron`,
        `${gameName} Property Developer`,
        `${gameName} Real Estate Magnate`,
      ],
    };
    
    const options = strategyNames[strategyType] || [`${gameName} ${strategyType.replace('_', ' ')} Strategy`];
    return options[Math.floor(Math.random() * options.length)];
  }

  private generateStrategyDescription(
    strategyType: string, 
    gameId: string,
    actionTemplate: Partial<GameAction>
  ): string {
    const gameName = this.gameIntelligence.getGameData(gameId).name;
    
    switch (strategyType) {
      case 'resource_farming':
        return `Automatically farm ${actionTemplate.parameters?.resourceTypes.join(', ')} resources in ${gameName} at ${actionTemplate.parameters?.location} for optimal efficiency.`;
        
      case 'asset_trading':
        return `Monitor the ${gameName} marketplace and sell assets when they increase in price by at least ${actionTemplate.parameters?.minPriceIncrease}%.`;
        
      case 'competition_entry':
        return `Participate in ${gameName} tournaments using the best available ${actionTemplate.parameters?.carClass} with a maximum entry fee of ${actionTemplate.parameters?.entryFee.replace('_', ' ')}.`;
        
      case 'land_development':
        return `Develop ${gameName} land by building ${actionTemplate.parameters?.buildingType.replace('_', ' ')}s to generate passive income, investing up to ${actionTemplate.parameters?.investment.replace('_', ' ')}.`;
        
      default:
        return `Execute optimal ${strategyType.replace('_', ' ')} strategy in ${gameName}.`;
    }
  }

  private estimateROI(strategyType: string, gameId: string, actions: GameAction[]): number {
    // In a real implementation, this would use historical data and ML
    // For this prototype, we'll use reasonable estimates
    
    switch (strategyType) {
      case 'resource_farming':
        return 15; // 15% ROI - low risk, moderate return
        
      case 'asset_trading':
        return 30; // 30% ROI - medium risk, higher return
        
      case 'competition_entry':
        return 50; // 50% ROI - high risk, high potential return
        
      case 'land_development':
        return 25; // 25% ROI - medium risk, long-term return
        
      default:
        return 20; // Default estimate
    }
  }

  private determineRequiredAssets(gameId: string, actionTemplate: Partial<GameAction>): string[] {
    const requiredAssets: string[] = [];
    
    switch (actionTemplate.actionType) {
      case 'farm_resources':
        // Farming might require tools or equipment
        requiredAssets.push('basic_tools');
        break;
        
      case 'sell_assets':
        // Need assets to sell, but we don't know which ones yet
        // They'll be determined at execution time
        break;
        
      case 'enter_tournament':
        // Need a race car
        requiredAssets.push('race_car');
        break;
        
      case 'develop_land':
        // Need land to develop
        requiredAssets.push('land_plot');
        break;
    }
    
    return requiredAssets;
  }

  // Get all active strategies
  getActiveStrategies(): GameStrategy[] {
    return Object.values(this.state.strategies).filter(
      strategy => strategy.status === 'active'
    );
  }
  
  // Get strategies for a specific game
  getGameStrategies(gameId: string): GameStrategy[] {
    return Object.values(this.state.strategies).filter(
      strategy => strategy.gameId === gameId
    );
  }
  
  // Update strategy performance after execution
  updateStrategyPerformance(strategyId: string, performance: number): void {
    if (this.state.strategies[strategyId]) {
      this.state.strategies[strategyId].lastExecutedAt = Date.now();
      this.state.strategies[strategyId].lastPerformance = performance;
      this.state.strategies[strategyId].updatedAt = Date.now();
      
      // Save state
      this.saveState();
    }
  }
  
  // Get the highest priority strategies to execute
  getPriorityStrategies(limit: number = 3): GameStrategy[] {
    // Get all active strategies
    const activeStrategies = this.getActiveStrategies();
    
    // Sort by priority score (highest first)
    return activeStrategies
      .sort((a, b) => {
        // Calculate overall priority based on:
        // 1. The highest priority action in the strategy
        // 2. Estimated ROI
        // 3. Last performance (if available)
        
        const aHighestPriority = Math.max(...a.actions.map(action => action.priorityScore));
        const bHighestPriority = Math.max(...b.actions.map(action => action.priorityScore));
        
        // Weight priority score higher than ROI
        const aScore = aHighestPriority * 0.7 + a.estimatedROI * 0.3;
        const bScore = bHighestPriority * 0.7 + b.estimatedROI * 0.3;
        
        // If scores are close, consider last performance
        if (Math.abs(aScore - bScore) < 5) {
          const aPerformance = a.lastPerformance || 0;
          const bPerformance = b.lastPerformance || 0;
          
          return bPerformance - aPerformance;
        }
        
        return bScore - aScore;
      })
      .slice(0, limit);
  }
}

// Example usage
async function main() {
  try {
    // First initialize the game intelligence system
    const gameIntelligence = new GameIntelligenceSystem();
    await gameIntelligence.initialize();
    await gameIntelligence.gatherGameIntelligence();
    
    // Then create the strategy optimizer
    const strategyOptimizer = new StrategyOptimizer(gameIntelligence);
    const strategies = await strategyOptimizer.generateStrategies();
    
    console.log('\nGenerated Strategies:');
    strategies.forEach(strategy => {
      console.log(`\n${strategy.name} (ROI: ${strategy.estimatedROI}%)`);
      console.log(`Description: ${strategy.description}`);
      console.log('Actions:');
      strategy.actions.forEach(action => {
        console.log(` - ${action.actionType} (Priority: ${action.priorityScore}, Risk: ${action.riskLevel})`);
        console.log(`   Expected outcome: ${action.expectedOutcome}`);
      });
      console.log(`Required assets: ${strategy.requiredAssets.join(', ') || 'None'}`);
    });
    
    // Get top priority strategies
    const priorityStrategies = strategyOptimizer.getPriorityStrategies(2);
    
    console.log('\nTop Priority Strategies to Execute:');
    priorityStrategies.forEach(strategy => {
      console.log(`- ${strategy.name} (Priority: ${Math.max(...strategy.actions.map(a => a.priorityScore))})`);
    });
  } catch (error) {
    console.error('Error in strategy optimizer:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}
