import { EventEmitter } from 'events';
import type Database from 'better-sqlite3';
import type {
  Agent, Run, RunStep, RunResult, AgentRunnerConfig,
  Message, LLMResponse, ToolCall, ToolResult, ToolContext
} from './types';
import { createLLMClient, type LLMClient } from './llm-client';
import { globalRegistry } from './tool-registry';
import { AgentMemory } from './memory';
import { CircuitBreaker } from './circuit-breaker';

const RETRY_DELAYS_MS = [1000, 3000, 9000];
const MAX_RETRIES = 3;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  delays: number[] = RETRY_DELAYS_MS
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = delays[attempt] ?? delays[delays.length - 1];
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

function robustParseJSON(raw: string): unknown {
  // Strategy 1: direct parse
  try {
    return JSON.parse(raw);
  } catch (_) {}

  // Strategy 2: find first { ... } block
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = raw.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch (_) {}
  }

  // Strategy 3: find first [ ... ] block
  const firstBracket = raw.indexOf('[');
  const lastBracket = raw.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const candidate = raw.slice(firstBracket, lastBracket + 1);
    try {
      return JSON.parse(candidate);
    } catch (_) {}
  }

  // Strategy 4: strip markdown code fences and retry
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();
  try {
    return JSON.parse(stripped);
  } catch (_) {}

  return null;
}

export interface ExtendedMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
  name?: string;
}

export interface MultiAgentOrchestrator {
  delegate(agentId: string, goal: string, parentRunId: string): Promise<RunResult>;
}

export interface ExtendedAgentRunnerConfig extends AgentRunnerConfig {
  orchestrator?: MultiAgentOrchestrator;
  circuitBreakerThreshold?: number;
  circuitBreakerResetMs?: number;
}

export interface StepEvent {
  runId: string;
  step: RunStep;
}

export interface RunStartEvent {
  runId: string;
  agentId: string;
}

export interface RunCompleteEvent {
  runId: string;
  status: string;
}

export interface ErrorEvent {
  runId: string;
  error: string;
}

export interface ToolCallEvent {
  runId: string;
  toolName: string;
  input: unknown;
}

export interface ToolResultEvent {
  runId: string;
  toolName: string;
  result: ToolResult;
}

export class AgentRunner extends EventEmitter {
  private llm: LLMClient;
  private db: Database.Database;
  private maxSteps: number;
  private orchestrator?: MultiAgentOrchestrator;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private circuitBreakerThreshold: number;
  private circuitBreakerResetMs: number;

  constructor(private config: ExtendedAgentRunnerConfig) {
    super();
    this.llm = createLLMClient(config.llm);
    this.db = config.db;
    this.maxSteps = config.maxSteps ?? 15;
    this.orchestrator = config.orchestrator;
    this.circuitBreakerThreshold = config.circuitBreakerThreshold ?? 5;
    this.circuitBreakerResetMs = config.circuitBreakerResetMs ?? 30000;
  }

  private getCircuitBreaker(toolName: string): CircuitBreaker {
    if (!this.circuitBreakers.has(toolName)) {
      this.circuitBreakers.set(
        toolName,
        new CircuitBreaker(this.circuitBreakerThreshold, this.circuitBreakerResetMs)
      );
    }
    return this.circuitBreakers.get(toolName)!;
  }

  async run(agent: Agent, goal?: string): Promise<RunResult> {
    const runId = crypto.randomUUID();
    const effectiveGoal = goal || agent.goal;
    const steps: RunStep[] = [];

    try {
      this.db.prepare(`
        INSERT INTO runs (id, agent_id, status, outcome_summary, started_at, created_at)
        VALUES (?, ?, 'running', '', datetime('now'), datetime('now'))
      `).run(runId, agent.id);
    } catch {
      // Table may have different schema; try alternate insert
      this.db.prepare(`
        INSERT INTO runs (id, agent_id, status, input, started_at, created_at)
        VALUES (?, ?, 'running', ?, datetime('now'), datetime('now'))
      `).run(runId, agent.id, effectiveGoal);
    }

    const startEvent: RunStartEvent = { runId, agentId: agent.id };
    this.emit('run_start', startEvent);

    try {
      const memory = new AgentMemory(agent.id, this.db);
      const memoryContext = await memory.summarize();
      const systemPrompt = this.buildSystemPrompt(agent, memoryContext);

      const messages: ExtendedMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: effectiveGoal },
      ];

      let stepCount = 0;
      let finalContent = '';

      while (stepCount < this.maxSteps) {
        stepCount++;

        const response = await withExponentialBackoff(() => this.llmLoop(messages));

        if (response.tool_calls && response.tool_calls.length > 0) {
          if (response.content) {
            const thoughtStep = this.saveStep(runId, 'thought', response.content);
            steps.push(thoughtStep);
            const stepEvent: StepEvent = { runId, step: thoughtStep };
            this.emit('step', stepEvent);
          }

          // Build assistant message with tool_calls in OpenAI format
          const assistantToolCalls = response.tool_calls.map(tc => ({
            id: `call_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`,
            type: 'function' as const,
            function: {
              name: tc.name,
              arguments: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input),
            },
          }));

          const assistantMessage: ExtendedMessage = {
            role: 'assistant',
            content: response.content || '',
            tool_calls: assistantToolCalls,
          };
          messages.push(assistantMessage);

          for (let i = 0; i < response.tool_calls.length; i++) {
            const toolCall = response.tool_calls[i];
            const toolCallId = assistantToolCalls[i].id;

            const toolCallStep = this.saveStep(
              runId, 'tool_call', `Calling ${toolCall.name}`,
              toolCall.name, JSON.stringify(toolCall.input)
            );
            steps.push(toolCallStep);
            const tcEvent: StepEvent = { runId, step: toolCallStep };
            this.emit('step', tcEvent);

            const toolCallEmitEvent: ToolCallEvent = {
              runId,
              toolName: toolCall.name,
              input: toolCall.input,
            };
            this.emit('tool_call', toolCallEmitEvent);

            const ctx: ToolContext = { agentId: agent.id, runId, db: this.db };

            // Handle delegation to sub-agent
            if (toolCall.name === 'delegate' && this.orchestrator) {
              const delegateInput = toolCall.input as { agentId?: string; goal?: string };
              const delegateResult = await this.orchestrator.delegate(
                delegateInput.agentId ?? '',
                delegateInput.goal ?? effectiveGoal,
                runId
              );
              const toolResult: ToolResult = {
                success: delegateResult.status !== 'fail',
                output: { summary: delegateResult.summary, steps: delegateResult.steps.length },
              };

              const resultStep = this.saveStep(
                runId, 'tool_result',
                toolResult.success ? 'Delegation succeeded' : `Delegation failed: ${toolResult.error}`,
                toolCall.name, undefined, JSON.stringify(toolResult.output)
              );
              steps.push(resultStep);
              const trStepEvent: StepEvent = { runId, step: resultStep };
              this.emit('step', trStepEvent);

              const trEvent: ToolResultEvent = { runId, toolName: toolCall.name, result: toolResult };
              this.emit('tool_result', trEvent);

              // Add tool result in OpenAI-compatible format
              const toolResultMessage: ExtendedMessage = {
                role: 'tool',
                tool_call_id: toolCallId,
                name: toolCall.name,
                content: JSON.stringify(toolResult.output),
              };
              messages.push(toolResultMessage);
              continue;
            }

            // Execute with circuit breaker + retry
            const cb = this.getCircuitBreaker(toolCall.name);
            let result: ToolResult;

            try {
              result = await withExponentialBackoff(() =>
                cb.execute(() => this.executeTool(toolCall.name, toolCall.input, ctx))
              );
            } catch (toolErr) {
              const errMsg = toolErr instanceof Error ? toolErr.message : String(toolErr);
              result = { success: false, output: null, error: errMsg };
            }

            const resultStep = this.saveStep(
              runId, 'tool_result',
              result.success ? 'Success' : `Error: ${result.error}`,
              toolCall.name, undefined, JSON.stringify(result.output)
            );
            steps.push(resultStep);
            const trStepEvent: StepEvent = { runId, step: resultStep };
            this.emit('step', trStepEvent);

            const trEvent: ToolResultEvent = { runId, toolName: toolCall.name, result };
            this.emit('tool_result', trEvent);

            // Add tool result in OpenAI-compatible format (role: 'tool' with tool_call_id)
            const toolResultMessage: ExtendedMessage = {
              role: 'tool',
              tool_call_id: toolCallId,
              name: toolCall.name,
              content: result.success
                ? JSON.stringify(result.output)
                : JSON.stringify({ error: result.error }),
            };
            messages.push(toolResultMessage);
          }
        } else {
          // No tool calls = final answer
          // Try to parse Ollama-style JSON tool call from content
          if (response.content) {
            const parsed = robustParseJSON(response.content);
            if (
              parsed !== null &&
              typeof parsed === 'object' &&
              'tool' in (parsed as object) &&
              typeof (parsed as Record<string, unknown>).tool === 'string'
            ) {
              const p = parsed as Record<string, unknown>;
              const syntheticToolCall: ToolCall = {
                name: p.tool as string,
                input: p.input ?? {},
              };

              const toolCallId = `call_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;

              const assistantMessage: ExtendedMessage = {
                role: 'assistant',
                content: '',
                tool_calls: [{
                  id: toolCallId,
                  type: 'function',
                  function: {
                    name: syntheticToolCall.name,
                    arguments: JSON.stringify(syntheticToolCall.input),
                  },
                }],
              };
              messages.push(assistantMessage);

              const toolCallStep = this.saveStep(
                runId, 'tool_call', `Calling ${syntheticToolCall.name}`,
                syntheticToolCall.name, JSON.stringify(syntheticToolCall.input)
              );
              steps.push(toolCallStep);
              this.emit('step', { runId, step: toolCallStep } as StepEvent);
              this.emit('tool_call', { runId, toolName: syntheticToolCall.name, input: syntheticToolCall.input } as ToolCallEvent);

              const ctx: ToolContext = { agentId: agent.id, runId, db: this.db };
              const cb = this.getCircuitBreaker(syntheticToolCall.name);
              let result: ToolResult;

              try {
                result = await withExponentialBackoff(() =>
                  cb.execute(() => this.executeTool(syntheticToolCall.name, syntheticToolCall.input, ctx))
                );
              } catch (toolErr) {
                const errMsg = toolErr instanceof Error ? toolErr.message : String(toolErr);
                result = { success: false, output: null, error: errMsg };
              }

              const resultStep = this.saveStep(
                runId, 'tool_result',
                result.success ? 'Success' : `Error: ${result.error}`,
                syntheticToolCall.name, undefined, JSON.stringify(result.output)
              );
              steps.push(resultStep);
              this.emit('step', { runId, step: resultStep } as StepEvent);
              this.emit('tool_result', { runId, toolName: syntheticToolCall.name, result } as ToolResultEvent);

              const toolResultMessage: ExtendedMessage = {
                role: 'tool',
                tool_call_id: toolCallId,
                name: syntheticToolCall.name,
                content: result.success
                  ? JSON.stringify(result.output)
                  : JSON.stringify({ error: result.error }),
              };
              messages.push(toolResultMessage);
              continue;
            }
          }

          finalContent = response.content;
          const finalStep = this.saveStep(runId, 'final', finalContent);
          steps.push(finalStep);
          const finalStepEvent: StepEvent = { runId, step: finalStep };
          this.emit('step', finalStepEvent);
          break;
        }
      }

      const status: RunResult['status'] = finalContent ? 'success' : 'partial';
      const summary = finalContent || 'Reached max steps without final answer';

      try {
        this.db.prepare(`
          UPDATE runs SET status = ?, outcome_summary = ?, finished_at = datetime('now') WHERE id = ?
        `).run(status, summary, runId);
      } catch {
        this.db.prepare(`
          UPDATE runs SET status = ?, output = ?, finished_at = datetime('now') WHERE id = ?
        `).run(status, summary, runId);
      }

      const completeEvent: RunCompleteEvent = { runId, status };
      this.emit('run_complete', completeEvent);
      return { runId, status, summary, steps };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      try {
        this.db.prepare(`
          UPDATE runs SET status = 'fail', outcome_summary = ?, finished_at = datetime('now') WHERE id = ?
        `).run(errorMsg, runId);
      } catch {
        this.db.prepare(`
          UPDATE runs SET status = 'failed', error = ?, finished_at = datetime('now') WHERE id = ?
        `).run(errorMsg, runId);
      }

      const errorEvent: ErrorEvent = { runId, error: errorMsg };
      this.emit('error', errorEvent);
      const completeEvent: RunCompleteEvent = { runId, status: 'fail' };
      this.emit('run_complete', completeEvent);
      return { runId, status: 'fail', summary: errorMsg, steps };
    }
  }

  async *streamRun(agent: Agent, goal?: string): AsyncGenerator<RunStep, RunResult, unknown> {
    const runId = crypto.randomUUID();
    const effectiveGoal = goal || agent.goal;
    const steps: RunStep[] = [];

    try {
      this.db.prepare(`
        INSERT INTO runs (id, agent_id, status, outcome_summary, started_at, created_at)
        VALUES (?, ?, 'running', '', datetime('now'), datetime('now'))
      `).run(runId, agent.id);
    } catch {
      this.db.prepare(`
        INSERT INTO runs (id, agent_id, status, input, started_at, created_at)
        VALUES (?, ?, 'running', ?, datetime('now'), datetime('now'))
      `).run(runId, agent.id, effectiveGoal);
    }

    const startEvent: RunStartEvent = { runId, agentId: agent.id };
    this.emit('run_start', startEvent);

    try {
      const memory = new AgentMemory(agent.id, this.db);
      const memoryContext = await memory.summarize();
      const systemPrompt = this.buildSystemPrompt(agent, memoryContext);

      const messages: ExtendedMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: effectiveGoal },
      ];

      let stepCount = 0;
      let finalContent = '';

      while (stepCount < this.maxSteps) {
        stepCount++;

        const response = await withExponentialBackoff(() => this.llmLoop(messages));

        if (response.tool_calls && response.tool_calls.length > 0) {
          if (response.content) {
            const thoughtStep = this.saveStep(runId, 'thought', response.content);
            steps.push(thoughtStep);
            this.emit('step', { runId, step: thoughtStep } as StepEvent);
            yield thoughtStep;
          }

          const assistantToolCalls = response.tool_calls.map(tc => ({
            id: `call_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`,
            type: 'function' as const,
            function: {
              name: tc.name,
              arguments: typeof tc.input === 'string' ? tc.input : JSON.stringify(tc.input),
            },
          }));

          const assistantMessage: ExtendedMessage = {
            role: 'assistant',
            content: response.content || '',
            tool_calls: assistantToolCalls,
          };
          messages.push(assistantMessage);

          for (let i = 0; i < response.tool_calls.length; i++) {
            const toolCall = response.tool_calls[i];
            const toolCallId = assistantToolCalls[i].id;

            const toolCallStep = this.saveStep(
              runId, 'tool_call', `Calling ${toolCall.name}`,
              toolCall.name, JSON.stringify(toolCall.input)
            );
            steps.push(toolCallStep);
            this.emit('step', { runId, step: toolCallStep } as StepEvent);
            this.emit('tool_call', { runId, toolName: toolCall.name, input: toolCall.input } as ToolCallEvent);
            yield toolCallStep;

            const ctx: ToolContext = { agentId: agent.id, runId, db: this.db };

            if (toolCall.name === 'delegate' && this.orchestrator) {
              const delegateInput = toolCall.input as { agentId?: string; goal?: string };
              const delegateResult = await this.orchestrator.delegate(
                delegateInput.agentId ?? '',
                delegateInput.goal ?? effectiveGoal,
                runId
              );
              const toolResult: ToolResult = {
                success: delegateResult.status !== 'fail',
                output: { summary: delegateResult.summary, steps: delegateResult.steps.length },
              };

              const resultStep = this.saveStep(
                runId, 'tool_result',
                toolResult.success ? 'Delegation succeeded' : `Delegation failed`,
                toolCall.name, undefined, JSON.stringify(toolResult.output)
              );
              steps.push(resultStep);
              this.emit('step', { runId, step: resultStep } as StepEvent);
              this.emit('tool_result', { runId, toolName: toolCall.name, result: toolResult } as ToolResultEvent);
              yield resultStep;

              messages.push({
                role: 'tool',
                tool_call_id: toolCallId,
                name: toolCall.name,
                content: JSON.stringify(toolResult.output),
              });
              continue;
            }

            const cb = this.getCircuitBreaker(toolCall.name);
            let result: ToolResult;

            try {
              result = await withExponentialBackoff(() =>
                cb.execute(() => this.executeTool(toolCall.name, toolCall.input, ctx))
              );
            } catch (toolErr) {
              const errMsg = toolErr instanceof Error ? toolErr.message : String(toolErr);
              result = { success: false, output: null, error: errMsg };
            }

            const resultStep = this.saveStep(
              runId, 'tool_result',
              result.success ? 'Success' : `Error: ${result.error}`,
              toolCall.name, undefined, JSON.stringify(result.output)
            );
            steps.push(resultStep);
            this.emit('step', { runId, step: resultStep } as StepEvent);
            this.emit('tool_result', { runId, toolName: toolCall.name, result } as ToolResultEvent);
            yield resultStep;

            messages.push({
              role: 'tool',
              tool_call_id: toolCallId,
              name: toolCall.name,
              content: result.success
                ? JSON.stringify(result.output)
                : JSON.stringify({ error: result.error }),
            });
          }
        } else {
          if (response.content) {
            const parsed = robustParseJSON(response.content);
            if (
              parsed !== null &&
              typeof parsed === 'object' &&
              'tool' in (parsed as object) &&
              typeof (parsed as Record<string, unknown>).tool === 'string'
            ) {
              const p = parsed as Record<string, unknown>;
              const syntheticToolCall: ToolCall = {
                name: p.tool as string,
                input: p.input ?? {},
              };

              const toolCallId = `call_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;

              messages.push({
                role: 'assistant',
                content: '',
                tool_calls: [{
                  id: toolCallId,
                  type: 'function',
                  function: {
                    name: syntheticToolCall.name,
                    arguments: JSON.stringify(syntheticToolCall.input),
                  },
                }],
              });

              const toolCallStep = this.saveStep(
                runId, 'tool_call', `Calling ${syntheticToolCall.name}`,
                syntheticToolCall.name, JSON.stringify(syntheticToolCall.input)
              );
              steps.push(toolCallStep);
              this.emit('step', { runId, step: toolCallStep } as StepEvent);
              this.emit('tool_call', { runId, toolName: syntheticToolCall.name, input: syntheticToolCall.input } as ToolCallEvent);
              yield toolCallStep;

              const ctx: ToolContext = { agentId: agent.id, runId, db: this.db };
              const cb = this.getCircuitBreaker(syntheticToolCall.name);
              let result: ToolResult;

              try {
                result = await withExponentialBackoff(() =>
                  cb.execute(() => this.executeTool(syntheticToolCall.name, syntheticToolCall.input, ctx))
                );
              } catch (toolErr) {
                const errMsg = toolErr instanceof Error ? toolErr.message : String(toolErr);
                result = { success: false, output: null, error: errMsg };
              }

              const resultStep = this.saveStep(
                runId, 'tool_result',
                result.success ? 'Success' : `Error: ${result.error}`,
                syntheticToolCall.name, undefined, JSON.stringify(result.output)
              );
              steps.push(resultStep);
              this.emit('step', { runId, step: resultStep } as StepEvent);
              this.emit('tool_result', { runId, toolName: syntheticToolCall.name, result } as ToolResultEvent);
              yield resultStep;

              messages.push({
                role: 'tool',
                tool_call_id: toolCallId,
                name: syntheticToolCall.name,
                content: result.success
                  ? JSON.stringify(result.output)
                  : JSON.stringify({ error: result.error }),
              });
              continue;
            }
          }

          finalContent = response.content;
          const finalStep = this.saveStep(runId, 'final', finalContent);
          steps.push(finalStep);
          this.emit('step', { runId, step: finalStep } as StepEvent);
          yield finalStep;
          break;
        }
      }

      const status: RunResult['status'] = finalContent ? 'success' : 'partial';
      const summary = finalContent || 'Reached max steps without final answer';

      try {
        this.db.prepare(`
          UPDATE runs SET status = ?, outcome_summary = ?, finished_at = datetime('now') WHERE id = ?
        `).run(status, summary, runId);
      } catch {
        this.db.prepare(`
          UPDATE runs SET status = ?, output = ?, finished_at = datetime('now') WHERE id = ?
        `).run(status, summary, runId);
      }

      this.emit('run_complete', { runId, status } as RunCompleteEvent);
      return { runId, status, summary, steps };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      try {
        this.db.prepare(`
          UPDATE runs SET status = 'fail', outcome_summary = ?, finished_at = datetime('now') WHERE id = ?
        `).run(errorMsg, runId);
      } catch {
        this.db.prepare(`
          UPDATE runs SET status = 'failed', error = ?, finished_at = datetime('now') WHERE id = ?
        `).run(errorMsg, runId);
      }

      this.emit('error', { runId, error: errorMsg } as ErrorEvent);
      this.emit('run_complete', { runId, status: 'fail' } as RunCompleteEvent);
      return { runId, status: 'fail', summary: errorMsg, steps };
    }
  }

  private async llmLoop(messages: ExtendedMessage[]): Promise<LLMResponse> {
    const tools = globalRegistry.list();
    // Cast to Message[] for llm-client compatibility; extended fields are passed through
    return this.llm.chat(messages as unknown as Message[], tools);
  }

  private async executeTool(toolName: string, input: unknown, ctx: ToolContext): Promise<ToolResult> {
    return globalRegistry.executeByName(toolName, input, ctx);
  }

  private buildSystemPrompt(agent: Agent, memoryContext: string): string {
    const tools = globalRegistry.list();
    const toolList = tools.map(t => `- ${t.name}: ${t.description}`).join('\n');
    const now = new Date().toISOString();

    const hasOllama = (this.config.llm.provider === 'ollama');
    const toolInstructions = hasOllama
      ? `Instructions for tool use:
- To use a tool, respond with a JSON object on its own line: {"tool": "tool_name", "input": {...}}
- After receiving tool results, analyze them and decide next steps
- When you have completed the task, provide your final answer as plain text
- Be concise and focused on the goal
- If a tool fails, try an alternative approach`
      : `Instructions for tool use:
- Use the provided tool definitions to call tools when needed
- After receiving tool results, analyze them and decide next steps
- When you have completed the task, provide your final answer as plain text
- Be concise and focused on the goal
- If a tool fails, try an alternative approach`;

    const delegateSection = this.orchestrator
      ? `\nDelegation:\n- You may delegate subtasks to other agents using the 'delegate' tool with {"agentId": "...", "goal": "..."}\n`
      : '';

    return `You are an AI agent named "${agent.name}".

Your goal: ${agent.goal}

${agent.instructions ? `Instructions:\n${agent.instructions}\n` : ''}
Available tools:
${toolList || 'No tools available.'}
${delegateSection}
${memoryContext}

Current date/time: ${now}

${toolInstructions}`;
  }

  private saveStep(
    runId: string,
    stepType: string,
    content: string,
    toolName?: string,
    toolInput?: string,
    toolOutput?: string
  ): RunStep {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    try {
      this.db.prepare(`
        INSERT INTO run_steps (id, run_id, step_type, content, tool_name, tool_input, tool_output, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, runId, stepType, content, toolName ?? null, toolInput ?? null, toolOutput ?? null, createdAt);
    } catch {
      // Try alternate schema (type instead of step_type)
      try {
        this.db.prepare(`
          INSERT INTO run_steps (id, run_id, type, content, tool_name, tool_input, tool_output, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, runId, stepType, content, toolName ?? null, toolInput ?? null, toolOutput ?? null, createdAt);
      } catch {
        // Best effort - step saving failed but we can continue
      }
    }

    return {
      id,
      run_id: runId,
      step_type: stepType as RunStep['step_type'],
      content,
      tool_name: toolName,
      tool_input: toolInput,
      tool_output: toolOutput,
      created_at: createdAt,
    };
  }
}
