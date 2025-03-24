
<div align="center">
    <img src="https://github.com/user-attachments/assets/7a53df0e-6556-4be3-be02-623da496dd18" alt="Logo" width="400">
</div>

# LiquidPlay

**Gamify your liquidity interactions with our AI terminal.**

## Overview

The LiquidPlay is project that combines the power of blockchain, social media, and gamification to create a unique user experience. It leverages Twitter to fetch the most recent posts from major Aptos protocols, allowing users to interact with these protocols and earn XP points based on their engagement.

## Description

LiquidPlay creates a gamified experience for blockchain users. By fetching and analyzing data from Aptos protocols through Twitter, the platform enables users to engage with these protocols directly through the terminal interface. Each interaction is scored and contributes to the user's XP, which is tracked on a global leaderboard.

Users can view their profile, check the leaderboard to see where they rank among other players, and see which protocols currently offer XP boosts for interactions.

## User Flow

```mermaid
flowchart TD
    A[User Enters LiquidPlay Terminal] --> B[Connect Wallet/View Profile]
    B --> C[Fetch Latest Protocol Posts from Twitter]
    C --> D[View Available Protocol Interactions]
    D --> E[Engage with Protocols to Earn XP]
    E --> F[Receive XP Boosts Based on Protocol Multipliers]
    F --> G[Check Position on Global Leaderboard]
    G --> H[Continue Engagement to Climb Leaderboard]
    
    style A fill:#22c55e20,stroke:#22c55e,color:#22c55e
    style B fill:#22c55e20,stroke:#22c55e,color:#22c55e
    style C fill:#22c55e20,stroke:#22c55e,color:#22c55e
    style D fill:#22c55e20,stroke:#22c55e,color:#22c55e
    style E fill:#22c55e20,stroke:#22c55e,color:#22c55e
    style F fill:#22c55e20,stroke:#22c55e,color:#22c55e
    style G fill:#22c55e20,stroke:#22c55e,color:#22c55e
    style H fill:#22c55e20,stroke:#22c55e,color:#22c55e
```

## Key Features

- **Protocol Interaction Scoring**: Fetches the latest posts from Aptos protocols on Twitter and assigns scores for user interactions.
- **XP Boosts**: Earn experience points by engaging with blockchain protocols directly through the terminal.
- **Global Leaderboard**: Compete against other users to climb the leaderboard based on your XP.
- **Gamification**: Transform liquidity interactions into a game-like experience.

## How It Works

1. **Fetch Protocol Posts**: The terminal retrieves the latest tweets from verified Aptos protocol accounts.
2. **Engage and Earn XP**: Users interact with these protocols to earn scores and XP boosts.
3. **Climb the Leaderboard**: Track your progress on the global leaderboard and compete with others in the community.

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS 4
- **Blockchain**: Aptos SDK (@aptos-labs/ts-sdk)
- **UI Framework**: Radix UI components, Assistant UI React
- **Data Handling**: Drizzle ORM, PostgreSQL
- **API Integration**: Twitter client for protocol data
- **AI Features**: AI SDK for OpenAI and Groq integrations
- **Styling**: Tailwind CSS
- **Development**: TypeScript, Bun

## Screenshots


![screenshot1](https://github.com/user-attachments/assets/2931df65-53ad-4413-b67e-a0395a95ecb5)
![screenshot2](https://github.com/user-attachments/assets/9e2a8aff-accb-4afb-81bf-9affabeac85e)
![screenshot3](https://github.com/user-attachments/assets/8bb00138-d77d-49a3-a296-5cdf44d6b363)
