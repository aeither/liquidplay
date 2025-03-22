import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { GameIntelligenceSystem } from './game-intelligence';
import { PerformanceTracker } from './performance-tracker';
import { AssetManager } from './scripts/game/asset-manager';
import { StrategyOptimizer } from './strategy-optimizer';

dotenv.config();

// Main controller for the CAST system
export class CASTController {
  private gameIntelligence: GameIntelligenceSystem;
  private strategyOptimizer: StrategyOptimizer;
  private assetManager: AssetManager;
  private performanceTracker: PerformanceTracker;
  private dataDir: string;
  private isRunning = false;
  private cycleInterval: NodeJS.Timeout | null = null;
  private cycleCount = 0;
  
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    console.log('Initializing CAST: Crypto Asset Strategy Tactician...');
    
    // Initialize components
    this.gameIntelligence = new GameIntelligenceSystem();
    this.assetManager = new AssetManager();
    this.strategyOptimizer = new StrategyOptimizer(this.gameIntelligence);
    this.performanceTracker = new PerformanceTracker(
      this.assetManager,
      this.gameIntelligence,
      this.strategyOptimizer
    );
  }

  async initialize(): Promise<void> {
    console.log('Starting initialization sequence...');
    
    try {
      // Initialize components in sequence
      console.log('\n1. Initializing Game Intelligence System...');
      await this.gameIntelligence.initialize();
      
      console.log('\n2. Initializing Asset Manager...');
      await this.assetManager.initialize();
      
      console.log('\nCASTing agents initialized successfully!');
      console.log('Ready to dominate the GameFi universe.');
    } catch (error) {
      console.error('Error during initialization:', error);
      throw error;
    }
  }

  async runCycle(): Promise<void> {
    if (this.isRunning) {
      console.log('Cycle already in progress. Please wait for it to complete.');
      return;
    }
    
    this.isRunning = true;
    console.log(`\n=========== Starting CAST Cycle #${++this.cycleCount} ===========`);
    const startTime = Date.now();
    
    try {
      // 1. Gather game intelligence
      console.log('\n1. Gathering game intelligence...');
      const gameData = await this.gameIntelligence.gatherGameIntelligence();
      console.log(`Intelligence gathered for ${Object.keys(gameData.games).length} games.`);
      
      // 2. Generate strategies
      console.log('\n2. Optimizing gaming strategies...');
      const strategies = await this.strategyOptimizer.generateStrategies();
      console.log(`Generated ${strategies.length} new strategies.`);
      
      // 3. Get priority strategies to execute
      const priorityStrategies = this.strategyOptimizer.getPriorityStrategies(2);
      console.log(`Selected ${priorityStrategies.length} priority strategies to execute.`);
      
      // 4. Execute strategies
      console.log('\n3. Executing priority strategies...');
      for (const strategy of priorityStrategies) {
        console.log(`\nExecuting strategy: ${strategy.name}`);
        const performance = await this.assetManager.executeStrategy(strategy);
        console.log(`Strategy performance: ${performance.toFixed(2)}%`);
        
        // Update strategy performance
        this.strategyOptimizer.updateStrategyPerformance(strategy.id, performance);
      }
      
      // 5. Track performance
      console.log('\n4. Tracking performance...');
      await this.performanceTracker.recordPerformance();
      
      // 6. Generate performance report
      const reportPath = this.performanceTracker.savePerformanceReport();
      if (reportPath) {
        console.log(`Performance report saved to: ${reportPath}`);
      }
      
      // 7. Display summary
      const overall = this.performanceTracker.getOverallPerformance();
      const portfolio = this.assetManager.getPortfolioValue();
      
      console.log('\n========== CAST Cycle Summary ==========');
      console.log(`- Portfolio Value: ${portfolio.toFixed(4)} APT`);
      console.log(`- Current ROI: ${overall.roi.toFixed(2)}%`);
      console.log(`- Cycle Duration: ${(Date.now() - startTime) / 1000} seconds`);
      console.log('========================================');
    } catch (error) {
      console.error('Error during execution cycle:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Start automatic cycles
  startAutoCycles(intervalMinutes = 60): void {
    if (this.cycleInterval) {
      console.log('Auto-cycles already running. Stop them first.');
      return;
    }
    
    console.log(`Starting auto-cycles with ${intervalMinutes} minute interval.`);
    
    // Run first cycle immediately
    this.runCycle().catch(console.error);
    
    // Set interval for subsequent cycles
    const intervalMs = intervalMinutes * 60 * 1000;
    this.cycleInterval = setInterval(() => {
      this.runCycle().catch(console.error);
    }, intervalMs);
  }

  // Stop automatic cycles
  stopAutoCycles(): void {
    if (this.cycleInterval) {
      clearInterval(this.cycleInterval);
      this.cycleInterval = null;
      console.log('Auto-cycles stopped.');
    } else {
      console.log('No auto-cycles running.');
    }
  }

  // Get current status
  getStatus(): {
    isRunning: boolean;
    cycleCount: number;
    autoCyclesActive: boolean;
    portfolioValue: number;
    roi: number;
  } {
    const overall = this.performanceTracker.getOverallPerformance();
    const portfolio = this.assetManager.getPortfolioValue();
    
    return {
      isRunning: this.isRunning,
      cycleCount: this.cycleCount,
      autoCyclesActive: this.cycleInterval !== null,
      portfolioValue: portfolio,
      roi: overall.roi,
    };
  }
}

async function main() {
  try {
    // Create and initialize CAST controller
    const cast = new CASTController();
    await cast.initialize();
    
    // Run a single cycle
    await cast.runCycle();
    
    // Optionally start auto-cycles for continuous operation
    // Uncomment this to start auto-cycles:
    // cast.startAutoCycles(15); // Run every 15 minutes
    
    console.log('CAST is ready for your commands!');
  } catch (error) {
    console.error('Error in CAST system:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}
