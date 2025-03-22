import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { AssetManager } from './asset-manager';
import { GameIntelligenceSystem } from './game-intelligence';
import { StrategyOptimizer } from './strategy-optimizer';

dotenv.config();

// Define types for performance data
interface PerformanceEntry {
  timestamp: number;
  gameId: string;
  assetValue: number;
  cashBalance: number;
  totalValue: number;
  actions: {
    actionType: string;
    value: number;
    status: string;
  }[];
  strategies: {
    strategyId: string;
    name: string;
    performance: number;
  }[];
}

interface GamePerformance {
  gameId: string;
  name: string;
  roi: number; // Overall ROI %
  totalInvestment: number;
  currentValue: number;
  bestStrategy?: {
    strategyId: string;
    name: string;
    performance: number;
  };
  worstStrategy?: {
    strategyId: string;
    name: string;
    performance: number;
  };
}

interface PerformanceTrackerState {
  historicalPerformance: PerformanceEntry[];
  gamePerformance: Record<string, GamePerformance>;
  overallROI: number;
  startingValue: number;
  currentValue: number;
  lastUpdated: number;
}

// Performance Tracker class
export class PerformanceTracker {
  private assetManager: AssetManager;
  private gameIntelligence: GameIntelligenceSystem;
  private strategyOptimizer: StrategyOptimizer;
  private state: PerformanceTrackerState;
  private dataDir: string;
  
  constructor(
    assetManager: AssetManager,
    gameIntelligence: GameIntelligenceSystem,
    strategyOptimizer: StrategyOptimizer
  ) {
    this.assetManager = assetManager;
    this.gameIntelligence = gameIntelligence;
    this.strategyOptimizer = strategyOptimizer;
    this.dataDir = path.join(process.cwd(), 'data');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    // Initialize or load state
    this.state = this.loadState();
  }

  private loadState(): PerformanceTrackerState {
    const statePath = path.join(this.dataDir, 'performance-tracker-state.json');
    
    if (fs.existsSync(statePath)) {
      try {
        return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
      } catch (error) {
        console.error('Error loading performance tracker state:', error);
      }
    }
    
    // Get current portfolio value
    const currentValue = this.assetManager.getPortfolioValue();
    
    // Return default state if no file exists or error occurred
    return {
      historicalPerformance: [],
      gamePerformance: {},
      overallROI: 0,
      startingValue: currentValue, // Use current value as starting point
      currentValue,
      lastUpdated: Date.now(),
    };
  }

  private saveState(): void {
    const statePath = path.join(this.dataDir, 'performance-tracker-state.json');
    
    try {
      fs.writeFileSync(statePath, JSON.stringify(this.state, null, 2));
    } catch (error) {
      console.error('Error saving performance tracker state:', error);
    }
  }

  // Record current performance
  async recordPerformance(): Promise<PerformanceEntry> {
    console.log('Recording current performance...');
    
    const now = Date.now();
    const transactions = this.assetManager.getRecentTransactions(50);
    
    // Get transactions since last update
    const recentTransactions = transactions.filter(
      tx => tx.timestamp > this.state.lastUpdated
    );
    
    // Calculate current value
    const currentValue = this.assetManager.getPortfolioValue();
    this.state.currentValue = currentValue;
    
    // Calculate overall ROI
    this.state.overallROI = ((currentValue - this.state.startingValue) / this.state.startingValue) * 100;
    
    // Group transactions by game
    const gameTransactions: Record<string, any[]> = {};
    
    recentTransactions.forEach(tx => {
      if (!gameTransactions[tx.gameId]) {
        gameTransactions[tx.gameId] = [];
      }
      
      gameTransactions[tx.gameId].push(tx);
    });
    
    // Record performance entry
    const entry: PerformanceEntry = {
      timestamp: now,
      gameId: 'all', // Overall performance
      assetValue: currentValue - this.assetManager.getBalance(),
      cashBalance: this.assetManager.getBalance(),
      totalValue: currentValue,
      actions: recentTransactions.map(tx => ({
        actionType: tx.actionType,
        value: tx.value,
        status: tx.status,
      })),
      strategies: [],
    };
    
    // Get strategies and their performance
    const strategies = this.strategyOptimizer.getActiveStrategies();
    
    strategies.forEach(strategy => {
      if (strategy.lastPerformance !== undefined) {
        entry.strategies.push({
          strategyId: strategy.id,
          name: strategy.name,
          performance: strategy.lastPerformance,
        });
      }
    });
    
    // Add entry to historical performance
    this.state.historicalPerformance.push(entry);
    
    // Update game-specific performance
    for (const [gameId, txs] of Object.entries(gameTransactions)) {
      this.updateGamePerformance(gameId, txs);
    }
    
    // Update last updated timestamp
    this.state.lastUpdated = now;
    
    // Save state
    this.saveState();
    
    console.log('Performance recording complete.');
    return entry;
  }

  private updateGamePerformance(gameId: string, transactions: any[]): void {
    const gameData = this.gameIntelligence.getGameData(gameId);
    
    if (!gameData) {
      return;
    }
    
    // Get inventory for this game
    const inventory = this.assetManager.getGameInventory(gameId);
    
    if (!inventory) {
      return;
    }
    
    // Calculate current value of assets in this game
    let currentValue = 0;
    
    inventory.assets.forEach(asset => {
      currentValue += asset.lastKnownValue * asset.quantity;
    });
    
    // Calculate total investment in this game (from transactions)
    let totalInvestment = 0;
    const allTxs = this.assetManager.getTransactions().filter(tx => tx.gameId === gameId);
    
    allTxs.forEach(tx => {
      if (tx.value < 0) {
        totalInvestment += Math.abs(tx.value);
      }
    });
    
    // Calculate ROI
    const roi = totalInvestment > 0 
      ? ((currentValue - totalInvestment) / totalInvestment) * 100 
      : 0;
    
    // Get strategies for this game
    const strategies = this.strategyOptimizer.getGameStrategies(gameId);
    
    // Find best and worst strategies
    let bestStrategy = undefined;
    let worstStrategy = undefined;
    
    strategies.forEach(strategy => {
      if (strategy.lastPerformance === undefined) {
        return;
      }
      
      const performanceData = {
        strategyId: strategy.id,
        name: strategy.name,
        performance: strategy.lastPerformance,
      };
      
      if (!bestStrategy || strategy.lastPerformance > bestStrategy.performance) {
        bestStrategy = performanceData;
      }
      
      if (!worstStrategy || strategy.lastPerformance < worstStrategy.performance) {
        worstStrategy = performanceData;
      }
    });
    
    // Update or create game performance
    this.state.gamePerformance[gameId] = {
      gameId,
      name: gameData.name,
      roi,
      totalInvestment,
      currentValue,
      bestStrategy,
      worstStrategy,
    };
  }

  // Get overall performance data
  getOverallPerformance(): {
    roi: number;
    startingValue: number;
    currentValue: number;
    lastUpdated: number;
  } {
    return {
      roi: this.state.overallROI,
      startingValue: this.state.startingValue,
      currentValue: this.state.currentValue,
      lastUpdated: this.state.lastUpdated,
    };
  }
  
  // Get performance for a specific game
  getGamePerformance(gameId: string): GamePerformance | null {
    return this.state.gamePerformance[gameId] || null;
  }
  
  // Get all game performances
  getAllGamePerformances(): Record<string, GamePerformance> {
    return this.state.gamePerformance;
  }
  
  // Get recent historical performance
  getRecentPerformance(limit = 10): PerformanceEntry[] {
    return this.state.historicalPerformance
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }
  
  // Get performance trend data
  getPerformanceTrend(days = 7): {
    timestamps: number[];
    values: number[];
  } {
    const now = Date.now();
    const startTime = now - (days * 24 * 60 * 60 * 1000);
    
    // Filter performance entries within time range
    const relevantEntries = this.state.historicalPerformance.filter(
      entry => entry.timestamp >= startTime
    );
    
    // If no entries, return empty trend
    if (relevantEntries.length === 0) {
      return {
        timestamps: [],
        values: [],
      };
    }
    
    // Sort by timestamp
    relevantEntries.sort((a, b) => a.timestamp - b.timestamp);
    
    // Extract timestamps and values
    const timestamps = relevantEntries.map(entry => entry.timestamp);
    const values = relevantEntries.map(entry => entry.totalValue);
    
    return {
      timestamps,
      values,
    };
  }
  
  // Generate performance report
  generatePerformanceReport(): string {
    const overall = this.getOverallPerformance();
    const gamePerformances = this.getAllGamePerformances();
    
    // Format date
    const formatDate = (timestamp: number) => {
      return new Date(timestamp).toLocaleString();
    };
    
    // Build report
    let report = '# CAST Performance Report\n\n';
    report += `Generated on: ${formatDate(Date.now())}\n\n`;
    
    report += '## Overall Performance\n\n';
    report += `- Starting Value: ${overall.startingValue.toFixed(4)} APT\n`;
    report += `- Current Value: ${overall.currentValue.toFixed(4)} APT\n`;
    report += `- ROI: ${overall.roi.toFixed(2)}%\n`;
    report += `- Last Updated: ${formatDate(overall.lastUpdated)}\n\n`;
    
    report += '## Game Performances\n\n';
    
    Object.values(gamePerformances).forEach(game => {
      report += `### ${game.name}\n\n`;
      report += `- Current Value: ${game.currentValue.toFixed(4)} APT\n`;
      report += `- Total Investment: ${game.totalInvestment.toFixed(4)} APT\n`;
      report += `- ROI: ${game.roi.toFixed(2)}%\n`;
      
      if (game.bestStrategy) {
        report += `- Best Strategy: ${game.bestStrategy.name} (${game.bestStrategy.performance.toFixed(2)}%)\n`;
      }
      
      if (game.worstStrategy) {
        report += `- Worst Strategy: ${game.worstStrategy.name} (${game.worstStrategy.performance.toFixed(2)}%)\n`;
      }
      
      report += '\n';
    });
    
    report += '## Recent Activity\n\n';
    
    const recentEntries = this.getRecentPerformance(5);
    
    recentEntries.forEach(entry => {
      report += `### ${formatDate(entry.timestamp)}\n\n`;
      report += `- Total Value: ${entry.totalValue.toFixed(4)} APT\n`;
      report += `- Asset Value: ${entry.assetValue.toFixed(4)} APT\n`;
      report += `- Cash Balance: ${entry.cashBalance.toFixed(4)} APT\n\n`;
      
      if (entry.actions.length > 0) {
        report += '#### Actions\n\n';
        
        entry.actions.forEach(action => {
          report += `- ${action.actionType}: ${action.value.toFixed(4)} APT (${action.status})\n`;
        });
        
        report += '\n';
      }
      
      if (entry.strategies.length > 0) {
        report += '#### Strategies\n\n';
        
        entry.strategies.forEach(strategy => {
          report += `- ${strategy.name}: ${strategy.performance.toFixed(2)}%\n`;
        });
        
        report += '\n';
      }
    });
    
    return report;
  }
  
  // Save performance report to file
  savePerformanceReport(): string {
    const report = this.generatePerformanceReport();
    const reportPath = path.join(this.dataDir, 'performance-report.md');
    
    try {
      fs.writeFileSync(reportPath, report);
      console.log(`Performance report saved to ${reportPath}`);
      return reportPath;
    } catch (error) {
      console.error('Error saving performance report:', error);
      return '';
    }
  }
}

// Example usage
async function main() {
  try {
    // First initialize the required components
    const gameIntelligence = new GameIntelligenceSystem();
    await gameIntelligence.initialize();
    await gameIntelligence.gatherGameIntelligence();
    
    const strategyOptimizer = new StrategyOptimizer(gameIntelligence);
    await strategyOptimizer.generateStrategies();
    
    const assetManager = new AssetManager();
    await assetManager.initialize();
    
    // Then create the performance tracker
    const performanceTracker = new PerformanceTracker(
      assetManager,
      gameIntelligence,
      strategyOptimizer
    );
    
    // Record current performance
    await performanceTracker.recordPerformance();
    
    // Generate and print performance report
    const report = performanceTracker.generatePerformanceReport();
    console.log(report);
    
    // Save report to file
    performanceTracker.savePerformanceReport();
    
    // Get overall performance
    const overall = performanceTracker.getOverallPerformance();
    console.log('\nCurrent ROI:', overall.roi.toFixed(2), '%');
    
    // Get game-specific performance
    const gamePerformances = performanceTracker.getAllGamePerformances();
    
    console.log('\nGame Performances:');
    Object.values(gamePerformances).forEach(game => {
      console.log(`${game.name}: ${game.roi.toFixed(2)}% ROI`);
    });
  } catch (error) {
    console.error('Error in performance tracker:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}
