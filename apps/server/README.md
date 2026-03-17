# AgentSwarp Server

> Hono + Bun API server. Ultra-lightweight, runs on 512MB RAM.

## Overview

`@agentswarm/server` is the backend API that powers AgentSwarp. Built with Hono on Bun for extreme performance and minimal memory usage.

### Features

- **REST API** -- Full CRUD for agents, runs, tools, and integrations
- **WebSocket** -- Real-time agent run streaming
- **Agent Executor** -- Runs agents with the `@agentswarm/core` engine
- **Cron Scheduler** -- Triggers agents on schedules
- **Webhook Handler** -- Receives and routes external webhooks

## Development

```bash
cd apps/server
bun install
bun dev
```

The API server starts at `http://localhost:3000`.

## Tech Stack

- [Hono](https://hono.dev) -- Ultra-fast web framework
- [Bun](https://bun.sh) -- JavaScript runtime (fast, low memory)
- [SQLite](https://www.sqlite.org) -- Zero-config database via `bun:sqlite`

## Memory Usage

Idle: ~40MB. Under load: ~120MB. We test every release on a 512MB VPS to ensure it stays light.
