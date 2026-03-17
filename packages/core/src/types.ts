import type Database from 'better-sqlite3';

export interface Agent {
  id: string;
  name: string;
  goal: string;
  instructions: string;
  icon: string;
  status: 'active' | 'paused' | 'draft';
  created_at: string;
  updated_at: string;
}

export interface Run {
  id: string;
  agent_id: string;
  status: 'queued' | 'running' | 'success' | 'partial' | 'fail';
  outcome_summary: string;
  started_at: string;
  finished_at: string;
  created_at: string;
}

export interface RunStep {
  id: string;
  run_id: string;
  step_type: 'thought' | 'tool_call' | 'tool_result' | 'final';
  content: string;
  tool_name?: string;
  tool_input?: string;
  tool_output?: string;
  created_at: string;
}

export interface LLMConfig {
  provider: 'openai' | 'groq' | 'anthropic' | 'ollama';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
}

export interface ToolDef {
  name: string;
  description: string;
  parameters: object;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  tool_calls?: ToolCall[];
}

export interface ToolCall {
  name: string;
  input: unknown;
}

export interface ToolResult {
  success: boolean;
  output: unknown;
  error?: string;
}

export interface AgentRunnerConfig {
  llm: LLMConfig;
  db: Database.Database;
  maxSteps?: number;
}

export interface RunResult {
  runId: string;
  status: 'success' | 'partial' | 'fail';
  summary: string;
  steps: RunStep[];
}

export interface ToolContext {
  agentId: string;
  runId: string;
  db: Database.Database;
}

export interface ToolConfig {
  name: string;
  description: string;
  schema: unknown;
  execute: (input: unknown, context?: ToolContext) => Promise<unknown>;
}

export interface PluginConfig {
  name: string;
  version: string;
  description: string;
  tools: ToolConfig[];
  setup?: (env: NodeJS.ProcessEnv) => Promise<void>;
  requiredEnvVars?: string[];
}

export interface Plugin {
  name: string;
  version: string;
  description: string;
  tools: ToolConfig[];
}
