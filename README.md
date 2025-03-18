# Move Agent Kit Test Project

This is a simple test project for working with Move Agent Kit on the Aptos blockchain.

## Prerequisites

- Node.js 16.x or higher
- Bun runtime installed
- Git

## Setup

1. Install dependencies:
```
bun install
```

2. Configure your `.env` file with your API keys:
```
APTOS_PRIVATE_KEY="your_private_key_here"
ANTHROPIC_API_KEY="your_anthropic_api_key_here"
OPENAI_API_KEY="your_openai_api_key_here"
# PANORA_API_KEY="your_panora_api_key_here" # Optional
```

3. Run the project:
```
bun index.ts
```

Or use the npm script:
```
bun run start
```

## Project Structure

- `index.ts`: Main file that demonstrates how to initialize and use Move Agent Kit
- `.env`: Environment variables for API keys and configuration
- `package.json`: Project dependencies and scripts
- `tsconfig.json`: TypeScript configuration

## Available Examples

The `index.ts` file contains commented examples for:
- Token transfers
- Getting account balances
- Retrieving transaction information

Uncomment the relevant sections to test these features.

## Documentation

For more information, refer to the [Move Agent Kit documentation](https://github.com/Metamove/move-agent-kit).
