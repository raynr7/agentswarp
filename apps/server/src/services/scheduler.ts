import { DB } from "../db/client";
import { AgentRunnerService } from "./runner";

interface Trigger {
  id: string;
  agent_id: string;
  type: "schedule" | "webhook" | "manual";
  config: string | Record<string, unknown>;
  enabled: number;
  last_fired_at: string | null;
  created_at: string;
}

interface Agent {
  id: string;
  name: string;
  enabled: number;
}

const POLL_INTERVAL_MS = 60_000;

/**
 * Parse a cron expression or macro and return the interval in milliseconds.
 * Returns null if the expression is not recognized.
 */
function cronToIntervalMs(cronExpr: string): number | null {
  const trimmed = cronExpr.trim();

  // Handle macros
  switch (trimmed) {
    case "@yearly":
    case "@annually":
      return 365 * 24 * 60 * 60 * 1000;
    case "@monthly":
      return 30 * 24 * 60 * 60 * 1000;
    case "@weekly":
      return 7 * 24 * 60 * 60 * 1000;
    case "@daily":
    case "@midnight":
      return 24 * 60 * 60 * 1000;
    case "@hourly":
      return 60 * 60 * 1000;
    case "@minutely":
      return 60 * 1000;
    default:
      break;
  }

  // Handle 5-field standard cron: minute hour day month weekday
  const parts = trimmed.split(/\s+/);
  if (parts.length !== 5) {
    return null;
  }

  const [minuteField] = parts;

  // Simple "*/N" step in the minute field -- treat the whole expression as
  // repeating every N minutes if all other fields are wildcards.
  const stepMatch = /^\*\/(\d+)$/.exec(minuteField);
  if (
    stepMatch &&
    parts[1] === "*" &&
    parts[2] === "*" &&
    parts[3] === "*" &&
    parts[4] === "*"
  ) {
    const step = parseInt(stepMatch[1], 10);
    if (step > 0) {
      return step * 60 * 1000;
    }
  }

  // "0 */N * * *" -- every N hours
  if (minuteField === "0" && parts[2] === "*" && parts[3] === "*" && parts[4] === "*") {
    const hourStep = /^\*\/(\d+)$/.exec(parts[1]);
    if (hourStep) {
      const step = parseInt(hourStep[1], 10);
      if (step > 0) {
        return step * 60 * 60 * 1000;
      }
    }
    // Specific hour, fires once per day
    if (/^\d+$/.test(parts[1])) {
      return 24 * 60 * 60 * 1000;
    }
  }

  // Fallback: if all fields are wildcards -> every minute
  if (parts.every((p) => p === "*")) {
    return 60 * 1000;
  }

  // Generic fallback: treat as daily if we cannot determine a finer interval
  return 24 * 60 * 60 * 1000;
}

/**
 * Determine whether a cron expression is due to fire.
 *
 * Strategy:
 *   - Derive the repeat interval from the expression.
 *   - If last_fired_at is null the trigger has never run -> fire immediately.
 *   - Otherwise fire if (now - lastFired) >= interval.
 */
export function isCronDue(
  cronExpr: string,
  lastFiredAt: string | null
): boolean {
  const intervalMs = cronToIntervalMs(cronExpr);
  if (intervalMs === null) {
    console.warn(`[SchedulerService] Cannot parse cron expression: "${cronExpr}". Skipping.`);
    return false;
  }

  if (lastFiredAt === null) {
    // Never fired before -- treat as due.
    return true;
  }

  const lastFiredMs = new Date(lastFiredAt).getTime();
  if (isNaN(lastFiredMs)) {
    // Invalid date stored -- fire to be safe.
    return true;
  }

  const nowMs = Date.now();
  return nowMs - lastFiredMs >= intervalMs;
}

// ---------------------------------------------------------------------------

export class SchedulerService {
  private static intervalHandle: ReturnType<typeof setInterval> | null = null;
  private static isRunning: boolean = false;

  /**
   * Start the scheduler. Polls every 60 seconds for due triggers.
   * Calling start() while already running is a no-op.
   */
  static start(): void {
    if (SchedulerService.isRunning) {
      console.warn("[SchedulerService] Already running. Ignoring start() call.");
      return;
    }

    console.log("[SchedulerService] Starting...");
    SchedulerService.isRunning = true;

    // Run immediately on start, then repeat on interval.
    void SchedulerService.poll();

    SchedulerService.intervalHandle = setInterval(() => {
      void SchedulerService.poll();
    }, POLL_INTERVAL_MS);
  }

  /**
   * Stop the scheduler and clear all intervals.
   */
  static stop(): void {
    if (!SchedulerService.isRunning) {
      return;
    }

    console.log("[SchedulerService] Stopping...");

    if (SchedulerService.intervalHandle !== null) {
      clearInterval(SchedulerService.intervalHandle);
      SchedulerService.intervalHandle = null;
    }

    SchedulerService.isRunning = false;
  }

  /**
   * Main poll loop -- scans for due schedule triggers and fires them.
   */
  private static async poll(): Promise<void> {
    console.debug("[SchedulerService] Polling for due triggers...");

    let triggers: Trigger[];

    try {
      triggers = DB.prepare(
        `SELECT t.id, t.agent_id, t.type, t.config, t.enabled, t.last_fired_at, t.created_at
         FROM triggers t
         WHERE t.type = 'schedule'
           AND t.enabled = 1`
      ).all() as Trigger[];
    } catch (err) {
      console.error("[SchedulerService] Failed to query triggers:", err);
      return;
    }

    if (triggers.length === 0) {
      console.debug("[SchedulerService] No active schedule triggers found.");
      return;
    }

    console.debug(`[SchedulerService] Evaluating ${triggers.length} schedule trigger(s).`);

    for (const trigger of triggers) {
      await SchedulerService.processTrigger(trigger);
    }
  }

  /**
   * Evaluate a single trigger and fire it if due.
   */
  private static async processTrigger(trigger: Trigger): Promise<void> {
    try {
      // Parse config
      let config: Record<string, unknown>;
      if (typeof trigger.config === "string") {
        try {
          config = JSON.parse(trigger.config) as Record<string, unknown>;
        } catch {
          console.error(
            `[SchedulerService] Trigger ${trigger.id}: invalid JSON config. Skipping.`
          );
          return;
        }
      } else {
        config = trigger.config;
      }

      const cronExpr = config["cron"];
      if (typeof cronExpr !== "string" || cronExpr.trim() === "") {
        console.warn(
          `[SchedulerService] Trigger ${trigger.id}: missing or empty config.cron. Skipping.`
        );
        return;
      }

      if (!isCronDue(cronExpr, trigger.last_fired_at)) {
        return;
      }

      console.log(
        `[SchedulerService] Trigger ${trigger.id} is due (cron: "${cronExpr}"). Firing...`
      );

      // Look up the associated agent
      let agent: Agent | undefined | null;
      try {
        agent = DB.prepare(
          `SELECT id, name, enabled FROM agents WHERE id = ?`
        ).get(trigger.agent_id) as Agent | undefined | null;
      } catch (err) {
        console.error(
          `[SchedulerService] Trigger ${trigger.id}: failed to look up agent ${trigger.agent_id}:`,
          err
        );
        return;
      }

      if (!agent) {
        console.warn(
          `[SchedulerService] Trigger ${trigger.id}: agent ${trigger.agent_id} not found. Skipping.`
        );
        return;
      }

      if (!agent.enabled) {
        console.warn(
          `[SchedulerService] Trigger ${trigger.id}: agent ${agent.id} ("${agent.name}") is disabled. Skipping.`
        );
        return;
      }

      // Fire the agent run
      await AgentRunnerService.startRun(agent);

      // Update last_fired_at
      try {
        DB.prepare(
          `UPDATE triggers SET last_fired_at = ? WHERE id = ?`
        ).run(new Date().toISOString(), trigger.id);
        console.log(
          `[SchedulerService] Trigger ${trigger.id} fired successfully. last_fired_at updated.`
        );
      } catch (err) {
        console.error(
          `[SchedulerService] Trigger ${trigger.id}: failed to update last_fired_at:`,
          err
        );
      }
    } catch (err) {
      // Catch-all so one failing trigger does not abort the others.
      console.error(
        `[SchedulerService] Unhandled error processing trigger ${trigger.id}:`,
        err
      );
    }
  }
}
