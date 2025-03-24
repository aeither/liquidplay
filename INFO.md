# Challenges I Ran Into

## Complex AI Workflow Debugging

The multi-agent architecture in LiquidPlay required orchestrating specialized agents for Twitter, Move blockchain, and UI interactions. Debugging these complex workflows proved challenging.

I discovered Mastra.ai, which provided the toolkit needed to develop and manage these AI agents and workflows, enabling me to create specialized agents, build multi-step workflows, and efficiently route user requests.

## Natural Language to Blockchain Transaction Mismatch

The `move-agent-kit` handled blockchain operations well but couldn't process natural language. Users naturally say "stake 0.5 APT" while blockchain tools require precise formats (Octas, exact addresses).

I solved this by creating an AI converter agent that:
1. Takes natural language input
2. Parses the intent and token amounts
3. Converts human-readable values to blockchain format (Octas)
4. Formats requests for protocol tools
5. Passes formatted requests to blockchain functions

This translation layer bridged the gap between user experience and technical requirements.

## Twitter API Rate Limit Issues

Twitter's strict API rate limits threatened LiquidPlay's social media functionality, which relies on fetching and analyzing protocol tweets.

I implemented ElizaOS's twitter-client library to bypass some rate limitations, allowing LiquidPlay to maintain core features like protocol tweet analysis, topic searches, and account monitoring without hitting API limits.
