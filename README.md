# AgentSwarp - Open-Source No-Code AI Agent Platform

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white)](https://hub.docker.com/r/agentswarm/agentswarm)
[![GitHub Stars](https://img.shields.io/github/stars/raynr7/agentswarm?style=social)](https://github.com/raynr7/agentswarm)
[![Discord](https://img.shields.io/badge/Discord-Join%20us-5865F2?logo=discord&logoColor=white)](https://discord.gg/agentswarm)

> Self-hosted no-code automation builder, designed to run on low RAM.

---

## What is AgentSwarp?

AgentSwarp lets anyone create powerful AI agents that automate real work - no coding required.

- **No-code builder** - Drag, drop, and connect blocks to build AI workflows.
- **Self-hosted and private** - Your data stays on your machine.
- **Bring your own model** - Ollama (local) or hosted providers (OpenAI, Anthropic, Groq, Google).

---

## Quick Start

### Docker (recommended)

```bash
docker run -p 3000:3000 agentswarm/agentswarm
```

Open [http://localhost:3000](http://localhost:3000) and start building agents.

### Docker Compose

```bash
git clone https://github.com/raynr7/agentswarm.git
cd agentswarm
cp .env.example .env
docker compose up -d
```

### From Source

```bash
git clone https://github.com/raynr7/agentswarm.git
cd agentswarm
bun install
bun dev
```

---

## System Requirements

| Spec | Minimum | Recommended |
|------|---------|-------------|
| **RAM** | 512 MB | 2 GB |
| **CPU** | 1 core | 2+ cores |
| **Storage** | 500 MB | 2 GB |
| **OS** | Linux, macOS, Windows (Docker) | Linux (Ubuntu 22.04+) |
| **Runtime** | Docker or Bun 1.0+ | Docker |

Yes, it actually runs on 512MB. We obsess over this.

---

## Bring Your Own AI

| Provider | Cost | Offline | Setup |
|----------|------|---------|-------|
| **Ollama** | Free | Yes | `OLLAMA_BASE_URL=http://localhost:11434` |
| **Groq** | Free tier | No | `GROQ_API_KEY=your-key` |
| **OpenAI** | Pay-per-use | No | `OPENAI_API_KEY=your-key` |
| **Anthropic** | Pay-per-use | No | `ANTHROPIC_API_KEY=your-key` |
| **Google Gemini** | Free tier | No | `GEMINI_API_KEY=your-key` |

Default: **Ollama with phi3:mini** - completely free, runs locally, no API key needed.

---

## Built-in Integrations

| Integration | Type | Status |
|-------------|------|--------|
| Gmail | Email trigger and send | Ready |
| Slack | Messages and commands | Ready |
| Discord | Bot and webhooks | Ready |
| Notion | Read and write pages | Ready |
| GitHub | Issues, PRs, webhooks | Ready |
| Airtable | Read and write records | Ready |
| Google Sheets | Read and write cells | Ready |
| HTTP / Webhooks | Any REST API | Ready |
| RSS | Feed monitoring | Ready |
| Twitter / X | Post and monitor | Ready |
| Telegram | Bot messages | Ready |

Don't see yours? Build a custom integration with our HTTP block or [open a request](https://github.com/raynr7/agentswarm/issues/new).

---

## Architecture

```
AgentSwarp
├── apps/
│   ├── web/          SvelteKit frontend (port 3000)
│   └── server/       Bun + Hono API server (port 3001)
├── packages/
│   ├── core/         Agent engine, LLM abstraction, SQLite persistence
│   └── tools/        Built-in tools (search, integrations)
├── docker-compose.yml
└── Dockerfile
```

**How it works:**

```
User Input -> Agent Runner -> LLM (Ollama/OpenAI/Groq/etc)
                |                    |
                v                    v
          Tool Execution      Response Generation
                |                    |
                v                    v
          SQLite Storage <--- Run Steps + Memory
```

---

## Roadmap

| Version | Milestone | Status |
|---------|-----------|--------|
| **v0.1** | Foundation - agent runner, LLM abstraction, SQLite store, basic UI | Done |
| **v0.2** | No-code canvas - visual builder, blocks, templates | In progress |
| **v0.3** | Ecosystem - templates, plugin marketplace, OAuth integrations | Planned |
| **v1.0** | Stable API and full feature set | Planned |

---

## Phase 2 Features

- **Visual Agent Builder** - Drag-and-drop workflow canvas
- **Command Palette** - Cmd+K quick search across agents, actions, and runs
- **Memory Dashboard** - Browse key-value store, vector memory, and workspace files
- **Theme Support** - Dark and light mode with system preference detection
- **Voice Controls** - Browser-based speech-to-text and text-to-speech
- **Personality System** - Built-in and custom AI personalities
- **Swarm Visualizer** - Real-time timeline of agent execution steps
- **Docker Compose** - One-command deployment with memory limits

---

## Contributing

We love contributions! AgentSwarp is built by the community, for the community.

```bash
# 1. Fork and clone
git clone https://github.com/YOUR_USERNAME/agentswarm.git
cd agentswarm

# 2. Install dependencies
bun install

# 3. Start development
bun dev
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide, code style, and PR process.

Look for issues tagged [good first issue](https://github.com/raynr7/agentswarm/labels/good%20first%20issue) to get started.

---

## License

[MIT](LICENSE) - use it however you want. Free forever.

---

Built for people who want automation without complexity.
