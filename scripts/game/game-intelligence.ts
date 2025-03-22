import { Scraper, SearchMode } from 'agent-twitter-client';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

// Define types for game data
interface GameEvent {
  game: string;
  eventType: string;
  description: string;
  timestamp: number;
  source: string;
  relevanceScore: number;
}

interface GameAsset {
  game: string;
  assetId: string;
  name: string;
  type: string;
  lastKnownPrice?: number;
  priceHistory?: { timestamp: number; price: number }[];
  attributes?: Record<string, any>;
}

interface GameStateData {
  games: Record<string, {
    name: string;
    lastUpdated: number;
    currentEvents: GameEvent[];
    upcomingEvents: GameEvent[];
    assets: Record<string, GameAsset>;
    playerActivity: number; // Relative measure of activity
    marketVolume?: number;
  }>;
}

// Game Intelligence System class
export class GameIntelligenceSystem {
  private scraper: Scraper;
  private gameState: GameStateData;
  private dataDir: string;
  private gameAccountsToTrack: Record<string, string[]> = {
    // Map games to relevant Twitter accounts
    'aptos_knights': ['AptosKnights', 'APTosGames', 'Aptos'],
    'crypto_racers': ['CryptoRacers', 'AptosRacing', 'Aptos'],
    'aptos_lands': ['AptosLands', 'AptosMetaverse', 'Aptos'],
  };

  constructor() {
    this.scraper = new Scraper();
    this.dataDir = path.join(process.cwd(), 'data');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    // Initialize or load game state
    this.gameState = this.loadGameState();
  }

  private loadGameState(): GameStateData {
    const statePath = path.join(this.dataDir, 'game-state.json');
    
    if (fs.existsSync(statePath)) {
      try {
        return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
      } catch (error) {
        console.error('Error loading game state:', error);
      }
    }
    
    // Return default state if no file exists or error occurred
    return {
      games: {
        'aptos_knights': {
          name: 'Aptos Knights',
          lastUpdated: Date.now(),
          currentEvents: [],
          upcomingEvents: [],
          assets: {},
          playerActivity: 0,
        },
        'crypto_racers': {
          name: 'Crypto Racers',
          lastUpdated: Date.now(),
          currentEvents: [],
          upcomingEvents: [],
          assets: {},
          playerActivity: 0,
        },
        'aptos_lands': {
          name: 'Aptos Lands',
          lastUpdated: Date.now(),
          currentEvents: [],
          upcomingEvents: [],
          assets: {},
          playerActivity: 0,
        },
      },
    };
  }

  private saveGameState(): void {
    const statePath = path.join(this.dataDir, 'game-state.json');
    
    try {
      fs.writeFileSync(statePath, JSON.stringify(this.gameState, null, 2));
    } catch (error) {
      console.error('Error saving game state:', error);
    }
  }

  async initialize(): Promise<void> {
    // Check if required environment variables are defined
    if (!process.env.TWITTER_USERNAME || !process.env.TWITTER_PASSWORD) {
      throw new Error('TWITTER_USERNAME and TWITTER_PASSWORD must be set in .env file');
    }

    // Login to Twitter
    console.log('Connecting to Twitter for game intelligence...');
    await this.scraper.login(
      process.env.TWITTER_USERNAME,
      process.env.TWITTER_PASSWORD,
    );
    console.log('Connected to Twitter successfully!');
  }

  async gatherGameIntelligence(): Promise<GameStateData> {
    console.log('Gathering game intelligence from social media...');
    
    // For each game, gather intelligence from relevant accounts
    for (const [gameId, game] of Object.entries(this.gameState.games)) {
      console.log(`Gathering intelligence for ${game.name}...`);
      
      const accounts = this.gameAccountsToTrack[gameId] || [];
      const gameEvents: GameEvent[] = [];
      
      // Get posts from each tracked account
      for (const account of accounts) {
        try {
          console.log(`Checking account: ${account}`);
          const posts = [];
          
          // Fetch latest 10 posts from this account
          for await (const tweet of this.scraper.getTweets(account, 10)) {
            posts.push(tweet);
          }
          
          // Process each post to extract game intelligence
          for (const post of posts) {
            // Skip if post is older than 7 days
            const postDate = new Date(post.timeParsed);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            if (postDate < sevenDaysAgo) continue;
            
            // Extract game events from post content
            const event = this.extractGameEvent(gameId, post);
            if (event) {
              gameEvents.push(event);
            }
            
            // If post contains asset information, update asset data
            this.extractAssetData(gameId, post);
          }
        } catch (error) {
          console.error(`Error gathering data from ${account}:`, error);
        }
      }
      
      // Update game events in state
      this.gameState.games[gameId].currentEvents = gameEvents;
      this.gameState.games[gameId].lastUpdated = Date.now();
      
      // Estimate player activity based on post engagement
      this.gameState.games[gameId].playerActivity = this.estimatePlayerActivity(gameId, accounts);
    }
    
    // Save updated state
    this.saveGameState();
    console.log('Game intelligence gathering complete.');
    
    return this.gameState;
  }

  private extractGameEvent(gameId: string, post: any): GameEvent | null {
    const text = post.text.toLowerCase();
    
    // Keywords to identify different event types
    const eventKeywords = {
      'tournament': ['tournament', 'competition', 'championship', 'contest'],
      'update': ['update', 'patch', 'release', 'version', 'maintenance'],
      'promotion': ['promotion', 'discount', 'sale', 'offer', 'free'],
      'airdrop': ['airdrop', 'drop', 'claim', 'free', 'reward'],
      'governance': ['vote', 'governance', 'proposal', 'dao', 'decision'],
    };
    
    // Check each event type
    for (const [eventType, keywords] of Object.entries(eventKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          // Calculate relevance score based on engagement
          const relevanceScore = 
            (post.likes || 0) * 0.5 + 
            (post.retweets || 0) * 2 + 
            (post.replies || 0) * 1;
          
          return {
            game: gameId,
            eventType,
            description: post.text,
            timestamp: post.timestamp * 1000, // Convert to milliseconds
            source: `twitter:${post.username}`,
            relevanceScore,
          };
        }
      }
    }
    
    return null;
  }

  private extractAssetData(gameId: string, post: any): void {
    const text = post.text.toLowerCase();
    
    // Simple regex patterns for asset mentions
    // In a real implementation, this would be more sophisticated
    const assetPatterns = [
      // Pattern for "X is now worth Y APT" or "X now costs Y APT"
      { regex: /(\w+)\s+(is now worth|now costs)\s+(\d+(?:\.\d+)?)\s*apt/i, type: 'price' },
      // Pattern for "New item: X" or "Introducing X"
      { regex: /(new item|introducing):\s*(\w+)/i, type: 'new_asset' },
      // Pattern for "Limited edition X" or "Rare X"
      { regex: /(limited edition|rare)\s+(\w+)/i, type: 'rare_asset' },
    ];
    
    for (const pattern of assetPatterns) {
      const matches = text.match(pattern.regex);
      if (matches) {
        if (pattern.type === 'price') {
          const assetName = matches[1];
          const price = parseFloat(matches[3]);
          
          // Normalize assetId
          const assetId = assetName.toLowerCase().replace(/\s+/g, '_');
          
          // Update or create asset in game state
          this.gameState.games[gameId].assets[assetId] = {
            ...this.gameState.games[gameId].assets[assetId] || {
              game: gameId,
              assetId,
              name: assetName,
              type: 'unknown',
              priceHistory: [],
            },
            lastKnownPrice: price,
          };
          
          // Add to price history
          if (!this.gameState.games[gameId].assets[assetId].priceHistory) {
            this.gameState.games[gameId].assets[assetId].priceHistory = [];
          }
          
          this.gameState.games[gameId].assets[assetId].priceHistory?.push({
            timestamp: post.timestamp * 1000,
            price,
          });
        } else if (pattern.type === 'new_asset' || pattern.type === 'rare_asset') {
          const assetName = matches[2];
          const assetId = assetName.toLowerCase().replace(/\s+/g, '_');
          
          this.gameState.games[gameId].assets[assetId] = {
            ...this.gameState.games[gameId].assets[assetId] || {
              game: gameId,
              assetId,
              name: assetName,
              type: pattern.type === 'new_asset' ? 'common' : 'rare',
              priceHistory: [],
            },
          };
        }
      }
    }
  }

  private estimatePlayerActivity(gameId: string, accounts: string[]): number {
    // In a real implementation, this would analyze engagement metrics
    // from social media and blockchain data
    
    // For this prototype, we'll return a random value between 0-100
    return Math.floor(Math.random() * 100);
  }

  // Method to get current game state
  getGameState(): GameStateData {
    return this.gameState;
  }
  
  // Method to get data for a specific game
  getGameData(gameId: string) {
    return this.gameState.games[gameId];
  }
  
  // Method to get all known assets for a game
  getGameAssets(gameId: string): Record<string, GameAsset> {
    return this.gameState.games[gameId]?.assets || {};
  }
  
  // Method to get current events for a game
  getGameEvents(gameId: string): GameEvent[] {
    return this.gameState.games[gameId]?.currentEvents || [];
  }
}

// Example usage
async function main() {
  try {
    const gameIntelligence = new GameIntelligenceSystem();
    await gameIntelligence.initialize();
    const gameData = await gameIntelligence.gatherGameIntelligence();
    
    console.log('\nGame Intelligence Summary:');
    for (const [gameId, game] of Object.entries(gameData.games)) {
      console.log(`\n${game.name}:`);
      console.log(`- Player Activity: ${game.playerActivity}%`);
      console.log(`- Current Events: ${game.currentEvents.length}`);
      console.log(`- Known Assets: ${Object.keys(game.assets).length}`);
      
      if (game.currentEvents.length > 0) {
        console.log('\nTop Events:');
        const sortedEvents = [...game.currentEvents].sort((a, b) => b.relevanceScore - a.relevanceScore);
        sortedEvents.slice(0, 3).forEach(event => {
          console.log(`- [${event.eventType}] ${event.description.substring(0, 100)}...`);
        });
      }
      
      if (Object.keys(game.assets).length > 0) {
        console.log('\nAsset Highlights:');
        const assets = Object.values(game.assets);
        const sortedAssets = assets
          .filter(asset => asset.lastKnownPrice)
          .sort((a, b) => (b.lastKnownPrice || 0) - (a.lastKnownPrice || 0));
        
        sortedAssets.slice(0, 3).forEach(asset => {
          console.log(`- ${asset.name}: ${asset.lastKnownPrice} APT`);
        });
      }
    }
  } catch (error) {
    console.error('Error in game intelligence system:', error);
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}
