import type Database from 'better-sqlite3';
import type { RunResult } from '@agentswarp/core';

export interface Job {
  id: string;
  type: 'agent_run' | 'scheduled_trigger' | 'sub_agent_delegate';
  payload: Record<string, unknown>;
  status: 'pending' | 'running' | 'done' | 'failed';
  created_at: string;
  updated_at: string;
  attempts: number;
}

export interface JobQueue {
  dequeue(limit: number): Job[];
  markRunning(jobId: string): void;
  markDone(jobId: string): void;
  markFailed(jobId: string, error: string): void;
}

export interface AgentRunner {
  run(agentId: string, input: string, runId?: string): Promise<RunResult>;
}

export interface WorkerPoolConfig {
  db: Database.Database;
  queue: JobQueue;
  runner: AgentRunner;
  maxConcurrent?: number;
  pollInterval?: number;
  jobTimeout?: number;
}

const DEFAULT_MAX_CONCURRENT = 3;
const DEFAULT_POLL_INTERVAL_MS = 5_000;
const DEFAULT_JOB_TIMEOUT_MS = 5 * 60 * 1_000; // 5 minutes
const SHUTDOWN_GRACE_PERIOD_MS = 30_000;

function log(message: string, ...args: unknown[]): void {
  console.log(`[Worker] ${message}`, ...args);
}

function logError(message: string, ...args: unknown[]): void {
  console.error(`[Worker] ${message}`, ...args);
}

export class WorkerPool {
  private readonly db: Database.Database;
  private readonly queue: JobQueue;
  private readonly runner: AgentRunner;
  private readonly maxConcurrent: number;
  private readonly pollInterval: number;
  private readonly jobTimeout: number;

  private activeJobs: Map<string, Promise<void>> = new Map();
  private polling: boolean = false;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private stopping: boolean = false;

  constructor(config: WorkerPoolConfig) {
    this.db = config.db;
    this.queue = config.queue;
    this.runner = config.runner;
    this.maxConcurrent = config.maxConcurrent ?? DEFAULT_MAX_CONCURRENT;
    this.pollInterval = config.pollInterval ?? DEFAULT_POLL_INTERVAL_MS;
    this.jobTimeout = config.jobTimeout ?? DEFAULT_JOB_TIMEOUT_MS;
  }

  start(): void {
    if (this.polling) {
      log('Already started, ignoring start() call.');
      return;
    }
    this.stopping = false;
    this.polling = true;
    log(`Starting worker pool (maxConcurrent=${this.maxConcurrent}, pollInterval=${this.pollInterval}ms, jobTimeout=${this.jobTimeout}ms)`);
    this.setupSignalHandlers();
    this.schedulePoll();
  }

  async stop(): Promise<void> {
    if (!this.polling) {
      return;
    }
    this.stopping = true;
    this.polling = false;

    if (this.pollTimer !== null) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    log(`Stopping worker pool. Waiting for ${this.activeJobs.size} active job(s) to finish...`);

    const activeJobIds = Array.from(this.activeJobs.keys());
    if (activeJobIds.length > 0) {
      const gracefulShutdown = Promise.all(Array.from(this.activeJobs.values()));
      const timeout = new Promise<void>((resolve) =>
        setTimeout(() => {
          log(`Grace period expired (${SHUTDOWN_GRACE_PERIOD_MS}ms). Forcing shutdown.`);
          resolve();
        }, SHUTDOWN_GRACE_PERIOD_MS)
      );

      await Promise.race([gracefulShutdown, timeout]);
    }

    log('Worker pool stopped.');
  }

  private setupSignalHandlers(): void {
    const handleSignal = async (signal: string): Promise<void> => {
      log(`Received ${signal}. Initiating graceful shutdown...`);
      await this.stop();
      process.exit(0);
    };

    process.once('SIGTERM', () => handleSignal('SIGTERM'));
    process.once('SIGINT', () => handleSignal('SIGINT'));
  }

  private schedulePoll(): void {
    if (!this.polling) {
      return;
    }
    this.pollTimer = setTimeout(() => {
      this.poll().catch((err: unknown) => {
        logError('Unexpected error during poll:', err);
      });
    }, this.pollInterval);
  }

  private async poll(): Promise<void> {
    if (!this.polling) {
      return;
    }

    const available = this.maxConcurrent - this.activeJobs.size;
    if (available <= 0) {
      log(`All ${this.maxConcurrent} worker slots busy. Skipping poll.`);
      this.schedulePoll();
      return;
    }

    let jobs: Job[] = [];
    try {
      jobs = this.queue.dequeue(available);
    } catch (err: unknown) {
      logError('Failed to dequeue jobs:', err);
      this.schedulePoll();
      return;
    }

    if (jobs.length === 0) {
      this.schedulePoll();
      return;
    }

    log(`Dequeued ${jobs.length} job(s).`);

    for (const job of jobs) {
      const jobPromise = this.executeJob(job).finally(() => {
        this.activeJobs.delete(job.id);
        log(`Job ${job.id} (${job.type}) removed from active pool. Active: ${this.activeJobs.size}`);
      });
      this.activeJobs.set(job.id, jobPromise);
    }

    this.schedulePoll();
  }

  private async executeJob(job: Job): Promise<void> {
    log(`Starting job ${job.id} (type=${job.type})`);

    try {
      this.queue.markRunning(job.id);
    } catch (err: unknown) {
      logError(`Failed to mark job ${job.id} as running:`, err);
      return;
    }

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Job ${job.id} timed out after ${this.jobTimeout}ms`)),
        this.jobTimeout
      )
    );

    try {
      await Promise.race([this.handleJob(job), timeoutPromise]);
      this.queue.markDone(job.id);
      log(`Job ${job.id} (${job.type}) completed successfully.`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logError(`Job ${job.id} (${job.type}) failed: ${errorMessage}`);
      try {
        this.queue.markFailed(job.id, errorMessage);
      } catch (markErr: unknown) {
        logError(`Failed to mark job ${job.id} as failed:`, markErr);
      }
    }
  }

  private async handleJob(job: Job): Promise<void> {
    switch (job.type) {
      case 'agent_run':
        await this.handleAgentRun(job);
        break;
      case 'scheduled_trigger':
        await this.handleScheduledTrigger(job);
        break;
      case 'sub_agent_delegate':
        await this.handleSubAgentDelegate(job);
        break;
      default: {
        const exhaustiveCheck: never = job.type;
        throw new Error(`Unknown job type: ${exhaustiveCheck}`);
      }
    }
  }

  private async handleAgentRun(job: Job): Promise<void> {
    const agentId = job.payload['agentId'];
    const input = job.payload['input'];
    const runId = job.payload['runId'];

    if (typeof agentId !== 'string') {
      throw new Error(`Job ${job.id}: missing or invalid agentId in payload`);
    }
    if (typeof input !== 'string') {
      throw new Error(`Job ${job.id}: missing or invalid input in payload`);
    }

    log(`Executing agent_run: agentId=${agentId}, runId=${runId ?? 'auto'}`);
    const result = await this.runner.run(
      agentId,
      input,
      typeof runId === 'string' ? runId : undefined
    );
    log(`agent_run result: runId=${result.runId}, status=${result.status}`);
  }

  private async handleScheduledTrigger(job: Job): Promise<void> {
    const agentId = job.payload['agentId'];
    const triggerId = job.payload['triggerId'];
    const input = job.payload['input'] ?? '';

    if (typeof agentId !== 'string') {
      throw new Error(`Job ${job.id}: missing or invalid agentId in payload`);
    }

    log(`Executing scheduled_trigger: agentId=${agentId}, triggerId=${triggerId ?? 'unknown'}`);
    const result = await this.runner.run(agentId, typeof input === 'string' ? input : '');
    log(`scheduled_trigger result: runId=${result.runId}, status=${result.status}`);
  }

  private async handleSubAgentDelegate(job: Job): Promise<void> {
    const parentRunId = job.payload['parentRunId'];
    const childAgentId = job.payload['childAgentId'];
    const input = job.payload['input'];

    if (typeof childAgentId !== 'string') {
      throw new Error(`Job ${job.id}: missing or invalid childAgentId in payload`);
    }
    if (typeof input !== 'string') {
      throw new Error(`Job ${job.id}: missing or invalid input in payload`);
    }

    log(`Executing sub_agent_delegate: parentRunId=${parentRunId ?? 'unknown'}, childAgentId=${childAgentId}`);
    const result = await this.runner.run(childAgentId, input);
    log(`sub_agent_delegate result: runId=${result.runId}, status=${result.status}`);
  }
}
