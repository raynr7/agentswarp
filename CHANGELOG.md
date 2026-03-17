# Changelog

## [Unreleased]

## [0.1.0] - 2026-03-16

### Added
- Initial repository scaffold
- Core agent runner architecture (LLM loop + tool calling)
- 14 built-in tools: HTTP, Email, Slack, GitHub, Notion, Google Sheets, Discord, Telegram, Twitter/X, Airtable, RSS, Web Scrape, Code Execution, Database
- SvelteKit UI with dark theme
- SQLite persistence (agents, runs, steps, memory, triggers)
- Cron scheduler + webhook triggers
- Plugin SDK for community tools
- Docker support (512MB RAM)
- GitHub Actions CI/CD
- Multi-provider LLM support: Ollama (free/offline), Groq, OpenAI, Anthropic
