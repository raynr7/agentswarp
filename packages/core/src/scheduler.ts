import * as cron from 'node-cron';
import type Database from 'better-sqlite3';
import type { AgentRunner } from './agent-runner';

interface ScheduledTask {
  triggerId: string;
  cronExpr: string;
  agentId: string;
  task: cron.ScheduledTask;
}

interface TriggerRow {
  id: string;
  agent_id: string;
  type: string;
  config: string;
  enabled: number;
  last_fired_at: string | null;
}

interface AgentRow {
  id: string;
  status: string;
  [key: string]: unknown;
}

interface RunRow {
  id: string;
  agent_id: string;
  status: string;
  [key: string]: unknown;
}

export class AgentScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  private intervals: NodeJS.Timeout[] = [];

  constructor(private db: Database.Database, private runner: AgentRunner) {}

  async start(): Promise<void> {
    console.log('[Scheduler] Starting...');

    await this.checkMissedRuns();
    await this.checkMissedTriggers();

    this.reload();

    console.log('[Scheduler] Active triggers:', this.tasks.size);
  }

  stop(): void {
    for (const { task } of this.tasks.values()) {
      task.stop();
    }
    this.tasks.clear();

    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals = [];

    console.log('[Scheduler] Stopped all tasks and cleared all intervals');
  }

  schedule(triggerId: string, cronExpr: string, agentId: string): void {
    if (!cron.validate(cronExpr)) {
      console.error(`[Scheduler] Invalid cron expression: ${cronExpr}`);
      return;
    }

    // Stop existing task if any
    this.unschedule(triggerId);

    const task = cron.schedule(cronExpr, async () => {
      console.log(`[Scheduler] Triggering agent ${agentId} (trigger: ${triggerId})`);
      try {
        const agent = this.db
          .prepare('SELECT * FROM agents WHERE id = ?')
          .get(agentId) as AgentRow | undefined;

        if (!agent) {
          console.log(`[Scheduler] Agent ${agentId} not found, skipping`);
          return;
        }

        if (agent.status !== 'active' && (agent as any).enabled !== 1) {
          console.log(`[Scheduler] Agent ${agentId} not active or not enabled, skipping`);
          return;
        }

        await this.runner.run(agent as any);

        // Update last_fired_at
        this.db
          .prepare(
            `UPDATE triggers SET last_fired_at = datetime('now'), last_run_at = datetime('now') WHERE id = ?`
          )
          .run(triggerId);
      } catch (error) {
        console.error(`[Scheduler] Error running agent ${agentId}:`, error);
      }
    });

    this.tasks.set(triggerId, { triggerId, cronExpr, agentId, task });
    console.log(`[Scheduler] Scheduled trigger ${triggerId} for agent ${agentId} with cron: ${cronExpr}`);
  }

  unschedule(triggerId: string): void {
    const existing = this.tasks.get(triggerId);
    if (existing) {
      existing.task.stop();
      this.tasks.delete(triggerId);
      console.log(`[Scheduler] Unscheduled trigger ${triggerId}`);
    }
  }

  reload(): void {
    // Stop all existing tasks without clearing intervals
    for (const { task } of this.tasks.values()) {
      task.stop();
    }
    this.tasks.clear();

    let triggers: TriggerRow[];
    try {
      triggers = this.db
        .prepare("SELECT * FROM triggers WHERE type = 'cron' AND enabled = 1")
        .all() as TriggerRow[];
    } catch (error) {
      console.error('[Scheduler] Failed to query triggers:', error);
      return;
    }

    for (const trigger of triggers) {
      try {
        const config = JSON.parse(trigger.config) as { cron?: string };
        if (!config.cron) {
          console.warn(`[Scheduler] Trigger ${trigger.id} has no cron expression, skipping`);
          continue;
        }
        this.schedule(trigger.id, config.cron, trigger.agent_id);
      } catch (error) {
        console.error(`[Scheduler] Failed to load trigger ${trigger.id}:`, error);
      }
    }

    console.log(`[Scheduler] Reloaded ${this.tasks.size} trigger(s)`);
  }

  /**
   * On startup, find any runs stuck in 'running' status from previous sessions
   * and requeue them by setting their status back to 'queued'.
   */
  async checkMissedRuns(): Promise<void> {
    console.log('[Scheduler] Checking for missed runs from previous sessions...');

    let stuckRuns: RunRow[];
    try {
      stuckRuns = this.db
        .prepare(
          `SELECT * FROM runs WHERE status = 'running' OR status = 'pending'`
        )
        .all() as RunRow[];
    } catch (error) {
      // Try alternative status values based on schema
      try {
        stuckRuns = this.db
          .prepare(`SELECT * FROM runs WHERE status IN ('running', 'pending')`)
          .all() as RunRow[];
      } catch (innerError) {
        console.error('[Scheduler] Failed to query stuck runs:', innerError);
        return;
      }
    }

    if (stuckRuns.length === 0) {
      console.log('[Scheduler] No stuck runs found');
      return;
    }

    console.log(`[Scheduler] Found ${stuckRuns.length} stuck run(s), requeueing...`);

    for (const run of stuckRuns) {
      try {
        // Mark as failed since we can't resume mid-run
        this.db
          .prepare(
            `UPDATE runs SET status = 'failed', error = 'Interrupted by server restart', finished_at = datetime('now') WHERE id = ?`
          )
          .run(run.id);

        console.log(`[Scheduler] Marked stuck run ${run.id} (agent: ${run.agent_id}) as failed`);

        // Requeue the agent by creating a new run
        const agent = this.db
          .prepare('SELECT * FROM agents WHERE id = ?')
          .get(run.agent_id) as AgentRow | undefined;

        if (agent && (agent.status === 'active' || (agent as any).enabled === 1)) {
          console.log(`[Scheduler] Requeueing agent ${run.agent_id} after stuck run cleanup`);
          try {
            await this.runner.run(agent as any);
          } catch (runError) {
            console.error(`[Scheduler] Failed to requeue agent ${run.agent_id}:`, runError);
          }
        }
      } catch (error) {
        console.error(`[Scheduler] Failed to process stuck run ${run.id}:`, error);
      }
    }
  }

  /**
   * On startup, check if any cron triggers should have fired within the last 1 hour window.
   * If so, fire them now to catch up on missed executions.
   */
  async checkMissedTriggers(): Promise<void> {
    console.log('[Scheduler] Checking for missed trigger firings in the last 1 hour...');

    let triggers: TriggerRow[];
    try {
      triggers = this.db
        .prepare("SELECT * FROM triggers WHERE type = 'cron' AND enabled = 1")
        .all() as TriggerRow[];
    } catch (error) {
      console.error('[Scheduler] Failed to query triggers for missed check:', error);
      return;
    }

    const now = new Date();
    const windowStart = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

    let missedCount = 0;

    for (const trigger of triggers) {
      try {
        const config = JSON.parse(trigger.config) as { cron?: string };
        if (!config.cron) continue;

        if (!cron.validate(config.cron)) {
          console.warn(`[Scheduler] Trigger ${trigger.id} has invalid cron expression: ${config.cron}`);
          continue;
        }

        const lastFired = trigger.last_fired_at ? new Date(trigger.last_fired_at) : null;

        // If never fired or last fired before the window start, check if it should have fired
        const checkFrom = lastFired && lastFired > windowStart ? lastFired : windowStart;

        const shouldHaveFired = this.cronShouldHaveFiredBetween(config.cron, checkFrom, now);

        if (shouldHaveFired) {
          console.log(
            `[Scheduler] Trigger ${trigger.id} missed firing since ${checkFrom.toISOString()}, firing now`
          );
          missedCount++;

          const agent = this.db
            .prepare('SELECT * FROM agents WHERE id = ?')
            .get(trigger.agent_id) as AgentRow | undefined;

          if (!agent) {
            console.log(`[Scheduler] Agent ${trigger.agent_id} not found, skipping missed trigger`);
            continue;
          }

          if (agent.status !== 'active' && (agent as any).enabled !== 1) {
            console.log(`[Scheduler] Agent ${trigger.agent_id} not active, skipping missed trigger`);
            continue;
          }

          try {
            await this.runner.run(agent as any);

            this.db
              .prepare(
                `UPDATE triggers SET last_fired_at = datetime('now'), last_run_at = datetime('now') WHERE id = ?`
              )
              .run(trigger.id);

            console.log(`[Scheduler] Successfully fired missed trigger ${trigger.id}`);
          } catch (runError) {
            console.error(`[Scheduler] Failed to fire missed trigger ${trigger.id}:`, runError);
          }
        }
      } catch (error) {
        console.error(`[Scheduler] Error processing trigger ${trigger.id} for missed check:`, error);
      }
    }

    if (missedCount === 0) {
      console.log('[Scheduler] No missed triggers found');
    } else {
      console.log(`[Scheduler] Processed ${missedCount} missed trigger(s)`);
    }
  }

  /**
   * Determine if a cron expression should have fired at least once between two dates.
   * Uses a simple minute-by-minute walk for the window (max 60 minutes).
   */
  private cronShouldHaveFiredBetween(cronExpr: string, from: Date, to: Date): boolean {
    // Walk minute by minute from 'from' to 'to' and check if any minute matches
    const clampedFrom = new Date(from);
    clampedFrom.setSeconds(0, 0);

    const clampedTo = new Date(to);
    clampedTo.setSeconds(0, 0);

    // Maximum 60 minutes to avoid excessive computation
    const maxMinutes = 60;
    let current = new Date(clampedFrom.getTime());
    let steps = 0;

    while (current <= clampedTo && steps < maxMinutes) {
      if (this.cronMatchesDate(cronExpr, current)) {
        return true;
      }
      current = new Date(current.getTime() + 60 * 1000);
      steps++;
    }

    return false;
  }

  /**
   * Check if a cron expression matches a given date.
   * Parses standard 5-field cron: minute hour day-of-month month day-of-week
   */
  private cronMatchesDate(cronExpr: string, date: Date): boolean {
    try {
      const parts = cronExpr.trim().split(/\s+/);

      // Handle both 5-field and 6-field (with seconds) cron expressions
      let minute: string, hour: string, dayOfMonth: string, month: string, dayOfWeek: string;

      if (parts.length === 5) {
        [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
      } else if (parts.length === 6) {
        // With seconds prefix
        [, minute, hour, dayOfMonth, month, dayOfWeek] = parts;
      } else {
        return false;
      }

      const dateMinute = date.getMinutes();
      const dateHour = date.getHours();
      const dateDayOfMonth = date.getDate();
      const dateMonth = date.getMonth() + 1; // 1-12
      const dateDayOfWeek = date.getDay(); // 0-6, Sunday=0

      return (
        this.cronFieldMatches(minute, dateMinute, 0, 59) &&
        this.cronFieldMatches(hour, dateHour, 0, 23) &&
        this.cronFieldMatches(dayOfMonth, dateDayOfMonth, 1, 31) &&
        this.cronFieldMatches(month, dateMonth, 1, 12) &&
        this.cronFieldMatches(dayOfWeek, dateDayOfWeek, 0, 6)
      );
    } catch {
      return false;
    }
  }

  /**
   * Check if a single cron field matches a value.
   * Supports: *, */n, n, n-m, n,m,o
   */
  private cronFieldMatches(field: string, value: number, min: number, max: number): boolean {
    if (field === '*') return true;

    // Step value: */n or start/n
    if (field.includes('/')) {
      const [rangeOrStar, stepStr] = field.split('/');
      const step = parseInt(stepStr, 10);
      if (isNaN(step) || step <= 0) return false;

      let rangeMin = min;
      let rangeMax = max;

      if (rangeOrStar !== '*') {
        if (rangeOrStar.includes('-')) {
          const [rMin, rMax] = rangeOrStar.split('-').map(Number);
          rangeMin = rMin;
          rangeMax = rMax;
        } else {
          rangeMin = parseInt(rangeOrStar, 10);
        }
      }

      for (let i = rangeMin; i <= rangeMax; i += step) {
        if (i === value) return true;
      }
      return false;
    }

    // List: n,m,o
    if (field.includes(',')) {
      return field.split(',').some((part) => this.cronFieldMatches(part.trim(), value, min, max));
    }

    // Range: n-m
    if (field.includes('-')) {
      const [rangeMin, rangeMax] = field.split('-').map(Number);
      return value >= rangeMin && value <= rangeMax;
    }

    // Exact value
    const num = parseInt(field, 10);
    if (isNaN(num)) return false;
    return num === value;
  }

  /**
   * Ensure the triggers table has a last_fired_at column.
   * Call this if the column might not exist yet.
   */
  ensureLastFiredAtColumn(): void {
    try {
      this.db.exec(`ALTER TABLE triggers ADD COLUMN last_fired_at TEXT`);
      console.log('[Scheduler] Added last_fired_at column to triggers table');
    } catch {
      // Column already exists, ignore
    }
  }
}
