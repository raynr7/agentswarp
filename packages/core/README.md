# AgentSwarp Core

> The agent runner engine. Handles LLM loops, tool calls, memory, and scheduling.

## Overview

`@agentswarm/core` is the heart of AgentSwarp. It provides:

- **Agent Runner** -- Execute agent workflows with retry logic and error handling
- **LLM Abstraction** -- Unified interface for Ollama, OpenAI, Anthropic, Groq, and Gemini
- **Tool System** -- Register and execute tools (HTTP calls, code execution, integrations)
- **Memory** -- SQLite-backed persistent memory for agents across runs
- **Scheduler** -- Cron-based scheduling for recurring agent tasks

## Usage

```typescript
import { AgentRunner, OllamaProvider } from "@agentswarm/core";

const runner = new AgentRunner({
  provider: new OllamaProvider({ model: "phi3:mini" }),
  tools: [/* your tools */],
});

const result = await runner.run("Summarize my latest emails");
```

## Architecture

This package is designed to be lightweight and dependency-free (except for the SQLite driver). It can run standalone or as part of the full AgentSwarp stack.
