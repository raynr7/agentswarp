import { EventEmitter } from 'events';
import crypto from 'crypto';
import { Agent, LLMConfig, ToolDef, RunResult, AgentRunnerConfig } from './types';
import { AgentRunner } from './agent-runner';
import { globalRegistry } from './tool-registry';
import { AgentMemory } from './memory';
import type { Database } from 'better-sqlite3';

export interface SpawnRequest {
  goal: string;
  tools?: string[];
  maxSteps?: number;
  personality?: string;
}

export interface SpawnResult {
  agentId: string;
  status: 'success' | 'error' | 'timeout';
  result: RunResult | null;
  duration: number;
  error?: string;
}

export interface MultiAgentConfig {
  db: Database;
  llmConfig: LLMConfig;
  maxDepth?: number;
  maxConcurrentSubAgents?: number;
  subAgentTimeout?: number;
}

const MAX_DEPTH = 3;
const MAX_CONCURRENT = 5;
const DEFAULT_TIMEOUT_MS = 60_000;

export class SubAgent extends EventEmitter {
  public readonly agentId: string;
  public readonly depth: number;
  public readonly parentId: string | null;
  private runner: AgentRunner;
  private agent: Agent;
  private db: Database;
  private memory: AgentMemory;
  private timeout: number;

  constructor(options: {
    agentId: string;
    depth: number;
    parentId: string | null;
    agent: Agent;
    db: Database;
    llmConfig: LLMConfig;
    timeout?: number;
    tools?: ToolDef[];
  }) {
    super();
    this.agentId = options.agentId;
    this.depth = options.depth;
    this.parentId = options.parentId;
    this.agent = options.agent;
    this.db = options.db;
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT_MS;
    this.memory = new AgentMemory(this.agentId, this.db);

    const config: AgentRunnerConfig = {
      llmConfig: options.llmConfig,
      tools: options.tools ?? [],
      db: this.db,
      maxSteps: options.agent.max_steps ?? 20,
    };
    this.runner = new AgentRunner(config);

    this.runner.on('step', (step: unknown) => this.emit('step', { agentId: this.agentId, step }));
    this.runner.on('tool_call', (tc: unknown) => this.emit('tool_call', { agentId: this.agentId, toolCall: tc }));
    this.runner.on('tool_result', (tr: unknown) => this.emit('tool_result', { agentId: this.agentId, toolResult: tr }));
    this.runner.on('error', (err: unknown) => this.emit('error', { agentId: this.agentId, error: err }));
  }

  getMemory(): AgentMemory {
    return this.memory;
  }

  async execute(goal?: string): Promise<SpawnResult> {
    const startTime = Date.now();
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const runPromise = this.runner.run(this.agent, goal);

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(new Error(`SubAgent ${this.agentId} timed out after ${this.timeout}ms`));
      }, this.timeout);
    });

    try {
      const result = await Promise.race([runPromise, timeoutPromise]);
      const duration = Date.now() - startTime;
      this.emit('complete', { agentId: this.agentId, result, duration });
      return {
        agentId: this.agentId,
        status: 'success',
        result,
        duration,
      };
    } catch (err: unknown) {
      const duration = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : String(err);
      const isTimeout = errorMessage.includes('timed out');
      this.emit(isTimeout ? 'timeout' : 'error', { agentId: this.agentId, error: errorMessage, duration });
      return {
        agentId: this.agentId,
        status: isTimeout ? 'timeout' : 'error',
        result: null,
        duration,
        error: errorMessage,
      };
    } finally {
      if (timeoutHandle !== null) {
        clearTimeout(timeoutHandle);
      }
    }
  }
}

export class MultiAgentOrchestrator extends EventEmitter {
  private db: Database;
  private llmConfig: LLMConfig;
  private maxDepth: number;
  private maxConcurrent: number;
  private subAgentTimeout: number;
  private activeAgents: Map<string, SubAgent>;
  private agentHierarchy: Map<string, string[]>;

  constructor(config: MultiAgentConfig) {
    super();
    this.db = config.db;
    this.llmConfig = config.llmConfig;
    this.maxDepth = config.maxDepth ?? MAX_DEPTH;
    this.maxConcurrent = config.maxConcurrentSubAgents ?? MAX_CONCURRENT;
    this.subAgentTimeout = config.subAgentTimeout ?? DEFAULT_TIMEOUT_MS;
    this.activeAgents = new Map();
    this.agentHierarchy = new Map();
  }

  private buildAgent(agentId: string, request: SpawnRequest, depth: number): Agent {
    const systemPrompt = [
      request.personality ?? 'You are a helpful AI assistant.',
      `You are operating at hierarchy depth ${depth} of ${this.maxDepth}.`,
      `Your goal is: ${request.goal}`,
      depth < this.maxDepth
        ? 'You may spawn sub-agents to delegate sub-tasks if needed.'
        : 'You are at maximum depth and cannot spawn further sub-agents.',
    ].join(' ');

    return {
      id: agentId,
      name: `agent-${agentId.slice(0, 8)}`,
      description: `Sub-agent at depth ${depth} for goal: ${request.goal}`,
      system_prompt: systemPrompt,
      llm_config: this.llmConfig,
      tools: request.tools ?? [],
      max_steps: request.maxSteps ?? 20,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Agent;
  }

  private resolveTools(toolNames?: string[]): ToolDef[] {
    if (!toolNames || toolNames.length === 0) {
      return globalRegistry.list();
    }
    return toolNames
      .map((name) => {
        const tool = globalRegistry.get(name);
        return tool ?? null;
      })
      .filter((t): t is ToolDef => t !== null);
  }

  private registerSubAgent(parentId: string | null, subAgent: SubAgent): void {
    this.activeAgents.set(subAgent.agentId, subAgent);
    if (parentId) {
      const children = this.agentHierarchy.get(parentId) ?? [];
      children.push(subAgent.agentId);
      this.agentHierarchy.set(parentId, children);
    }
    this.emit('spawn', {
      agentId: subAgent.agentId,
      parentId,
      depth: subAgent.depth,
    });
  }

  private unregisterSubAgent(agentId: string): void {
    this.activeAgents.delete(agentId);
  }

  async spawnSubAgent(
    parentId: string | null,
    request: SpawnRequest,
    currentDepth: number
  ): Promise<SpawnResult> {
    const newDepth = currentDepth + 1;

    if (newDepth > this.maxDepth) {
      const errResult: SpawnResult = {
        agentId: '',
        status: 'error',
        result: null,
        duration: 0,
        error: `Maximum agent depth of ${this.maxDepth} exceeded`,
      };
      this.emit('error', errResult);
      return errResult;
    }

    if (parentId) {
      const siblings = this.agentHierarchy.get(parentId) ?? [];
      const activeSiblings = siblings.filter((id) => this.activeAgents.has(id));
      if (activeSiblings.length >= this.maxConcurrent) {
        const errResult: SpawnResult = {
          agentId: '',
          status: 'error',
          result: null,
          duration: 0,
          error: `Maximum concurrent sub-agents (${this.maxConcurrent}) reached for parent ${parentId}`,
        };
        this.emit('error', errResult);
        return errResult;
      }
    }

    const agentId = crypto.randomUUID();
    const agent = this.buildAgent(agentId, request, newDepth);
    const tools = this.resolveTools(request.tools);

    const subAgent = new SubAgent({
      agentId,
      depth: newDepth,
      parentId,
      agent,
      db: this.db,
      llmConfig: this.llmConfig,
      timeout: this.subAgentTimeout,
      tools,
    });

    subAgent.on('step', (data: unknown) => this.emit('agent_step', data));
    subAgent.on('tool_call', (data: unknown) => this.emit('agent_tool_call', data));
    subAgent.on('tool_result', (data: unknown) => this.emit('agent_tool_result', data));
    subAgent.on('complete', (data: unknown) => {
      this.emit('complete', data);
      this.unregisterSubAgent(agentId);
    });
    subAgent.on('error', (data: unknown) => {
      this.emit('agent_error', data);
      this.unregisterSubAgent(agentId);
    });
    subAgent.on('timeout', (data: unknown) => {
      this.emit('agent_timeout', data);
      this.unregisterSubAgent(agentId);
    });

    this.registerSubAgent(parentId, subAgent);

    const spawnResult = await subAgent.execute(request.goal);
    return spawnResult;
  }

  async spawnParallel(
    parentId: string | null,
    requests: SpawnRequest[],
    currentDepth: number
  ): Promise<SpawnResult[]> {
    const batches: SpawnRequest[][] = [];
    for (let i = 0; i < requests.length; i += this.maxConcurrent) {
      batches.push(requests.slice(i, i + this.maxConcurrent));
    }

    const allResults: SpawnResult[] = [];
    for (const batch of batches) {
      const batchResults = await Promise.all(
        batch.map((req) => this.spawnSubAgent(parentId, req, currentDepth))
      );
      allResults.push(...batchResults);
    }
    return allResults;
  }

  aggregateResults(results: SpawnResult[]): AggregatedResult {
    const successful = results.filter((r) => r.status === 'success');
    const failed = results.filter((r) => r.status === 'error');
    const timedOut = results.filter((r) => r.status === 'timeout');

    const outputs: string[] = successful
      .map((r) => {
        if (!r.result) return null;
        const lastMessage = r.result.messages[r.result.messages.length - 1];
        if (!lastMessage) return null;
        return typeof lastMessage.content === 'string'
          ? lastMessage.content
          : JSON.stringify(lastMessage.content);
      })
      .filter((o): o is string => o !== null);

    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const maxDuration = results.reduce((max, r) => Math.max(max, r.duration), 0);

    return {
      totalAgents: results.length,
      successCount: successful.length,
      errorCount: failed.length,
      timeoutCount: timedOut.length,
      outputs,
      combinedOutput: outputs.join('\n\n---\n\n'),
      totalDuration,
      maxDuration,
      results,
    };
  }

  getActiveAgents(): string[] {
    return Array.from(this.activeAgents.keys());
  }

  getChildAgents(parentId: string): string[] {
    return this.agentHierarchy.get(parentId) ?? [];
  }

  getSubAgent(agentId: string): SubAgent | undefined {
    return this.activeAgents.get(agentId);
  }

  async runHierarchy(
    rootRequest: SpawnRequest,
    subRequests?: SpawnRequest[]
  ): Promise<HierarchyResult> {
    const rootId = crypto.randomUUID();
    const rootAgent = this.buildAgent(rootId, rootRequest, 0);
    const rootTools = this.resolveTools(rootRequest.tools);

    const rootRunnerConfig: AgentRunnerConfig = {
      llmConfig: this.llmConfig,
      tools: rootTools,
      db: this.db,
      maxSteps: rootRequest.maxSteps ?? 20,
    };

    const rootRunner = new AgentRunner(rootRunnerConfig);
    rootRunner.on('step', (step: unknown) => this.emit('root_step', { agentId: rootId, step }));
    rootRunner.on('tool_call', (tc: unknown) => this.emit('root_tool_call', { agentId: rootId, toolCall: tc }));
    rootRunner.on('error', (err: unknown) => this.emit('root_error', { agentId: rootId, error: err }));

    this.emit('spawn', { agentId: rootId, parentId: null, depth: 0 });

    const rootStartTime = Date.now();
    let rootRunResult: RunResult | null = null;
    let rootError: string | undefined;

    try {
      rootRunResult = await rootRunner.run(rootAgent, rootRequest.goal);
    } catch (err: unknown) {
      rootError = err instanceof Error ? err.message : String(err);
      this.emit('root_error', { agentId: rootId, error: rootError });
    }

    const rootDuration = Date.now() - rootStartTime;
    this.emit('complete', { agentId: rootId, result: rootRunResult, duration: rootDuration });

    let subResults: SpawnResult[] = [];
    if (subRequests && subRequests.length > 0) {
      subResults = await this.spawnParallel(rootId, subRequests, 0);
    }

    const aggregated = this.aggregateResults(subResults);

    return {
      rootAgentId: rootId,
      rootResult: rootRunResult,
      rootDuration,
      rootError,
      subResults,
      aggregated,
    };
  }
}

export interface AggregatedResult {
  totalAgents: number;
  successCount: number;
  errorCount: number;
  timeoutCount: number;
  outputs: string[];
  combinedOutput: string;
  totalDuration: number;
  maxDuration: number;
  results: SpawnResult[];
}

export interface HierarchyResult {
  rootAgentId: string;
  rootResult: RunResult | null;
  rootDuration: number;
  rootError?: string;
  subResults: SpawnResult[];
  aggregated: AggregatedResult;
}

export function createOrchestrator(config: MultiAgentConfig): MultiAgentOrchestrator {
  return new MultiAgentOrchestrator(config);
}

export function buildCommunicationMessage(
  fromAgentId: string,
  toAgentId: string,
  content: string,
  messageType: 'request' | 'response' | 'status'
): AgentMessage {
  return {
    id: crypto.randomUUID(),
    fromAgentId,
    toAgentId,
    content,
    messageType,
    timestamp: new Date().toISOString(),
  };
}

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  content: string;
  messageType: 'request' | 'response' | 'status';
  timestamp: string;
}

export class AgentCommunicationBus extends EventEmitter {
  private messageLog: AgentMessage[];

  constructor() {
    super();
    this.messageLog = [];
  }

  send(message: AgentMessage): void {
    this.messageLog.push(message);
    this.emit('message', message);
    this.emit(`message:${message.toAgentId}`, message);
  }

  sendMessage(
    fromAgentId: string,
    toAgentId: string,
    content: string,
    messageType: 'request' | 'response' | 'status' = 'request'
  ): AgentMessage {
    const message = buildCommunicationMessage(fromAgentId, toAgentId, content, messageType);
    this.send(message);
    return message;
  }

  getMessages(agentId?: string): AgentMessage[] {
    if (!agentId) return [...this.messageLog];
    return this.messageLog.filter(
      (m) => m.fromAgentId === agentId || m.toAgentId === agentId
    );
  }

  getMessagesTo(agentId: string): AgentMessage[] {
    return this.messageLog.filter((m) => m.toAgentId === agentId);
  }

  getMessagesFrom(agentId: string): AgentMessage[] {
    return this.messageLog.filter((m) => m.fromAgentId === agentId);
  }

  clearLog(): void {
    this.messageLog = [];
  }

  subscribeToAgent(agentId: string, handler: (message: AgentMessage) => void): () => void {
    const event = `message:${agentId}`;
    this.on(event, handler);
    return () => this.off(event, handler);
  }
}

export const globalCommunicationBus = new AgentCommunicationBus();
