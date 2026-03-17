import type Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

export type JobType = 'agent_run' | 'scheduled_trigger' | 'sub_agent_delegate';
export type JobStatus = 'pending' | 'running' | 'done' | 'failed';

export interface Job {
  id: string;
  type: JobType;
  payload: string;
  status: JobStatus;
  attempts: number;
  max_attempts: number;
  next_run_at: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error: string | null;
}

export interface JobStats {
  pending: number;
  running: number;
  done: number;
  failed: number;
}

export class JobQueue {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS job_queue (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 3,
        next_run_at TEXT,
        created_at TEXT,
        started_at TEXT,
        completed_at TEXT,
        error TEXT
      );
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_job_queue_status_next_run
      ON job_queue (status, next_run_at);
    `);
  }

  enqueue(
    type: JobType,
    payload: Record<string, unknown>,
    delayMs: number = 0
  ): Job {
    const id = randomUUID();
    const now = new Date();
    const nextRunAt = new Date(now.getTime() + delayMs);
    const createdAt = now.toISOString();
    const nextRunAtStr = nextRunAt.toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO job_queue (id, type, payload, status, attempts, max_attempts, next_run_at, created_at, started_at, completed_at, error)
      VALUES (?, ?, ?, 'pending', 0, 3, ?, ?, NULL, NULL, NULL)
    `);

    stmt.run(id, type, JSON.stringify(payload), nextRunAtStr, createdAt);

    return this.db
      .prepare('SELECT * FROM job_queue WHERE id = ?')
      .get(id) as Job;
  }

  dequeue(batchSize: number = 1): Job[] {
    const now = new Date().toISOString();

    const dequeueTransaction = this.db.transaction(() => {
      const pending = this.db
        .prepare(
          `SELECT * FROM job_queue
           WHERE status = 'pending'
             AND (next_run_at IS NULL OR next_run_at <= ?)
           ORDER BY next_run_at ASC, created_at ASC
           LIMIT ?`
        )
        .all(now, batchSize) as Job[];

      if (pending.length === 0) return [];

      const startedAt = new Date().toISOString();
      const updateStmt = this.db.prepare(
        `UPDATE job_queue SET status = 'running', started_at = ? WHERE id = ? AND status = 'pending'`
      );

      const updated: Job[] = [];
      for (const job of pending) {
        const result = updateStmt.run(startedAt, job.id);
        if (result.changes > 0) {
          updated.push(
            this.db
              .prepare('SELECT * FROM job_queue WHERE id = ?')
              .get(job.id) as Job
          );
        }
      }

      return updated;
    });

    return dequeueTransaction() as Job[];
  }

  markDone(id: string, result?: Record<string, unknown>): void {
    const completedAt = new Date().toISOString();
    const payload = result ? JSON.stringify(result) : null;

    this.db
      .prepare(
        `UPDATE job_queue
         SET status = 'done', completed_at = ?, error = NULL
         WHERE id = ?`
      )
      .run(completedAt, id);

    if (payload !== null) {
      // Optionally store result back in payload or a separate column
      // For now we just mark done; result can be stored externally
    }
  }

  markFailed(id: string, error: string): void {
    const completedAt = new Date().toISOString();

    this.db
      .prepare(
        `UPDATE job_queue
         SET status = 'failed', completed_at = ?, error = ?
         WHERE id = ?`
      )
      .run(completedAt, error, id);
  }

  retry(id: string): void {
    const job = this.db
      .prepare('SELECT * FROM job_queue WHERE id = ?')
      .get(id) as Job | undefined;

    if (!job) {
      throw new Error(`Job not found: ${id}`);
    }

    const newAttempts = job.attempts + 1;

    if (newAttempts >= job.max_attempts) {
      this.db
        .prepare(
          `UPDATE job_queue
           SET status = 'failed', attempts = ?, error = COALESCE(error, 'Max attempts reached')
           WHERE id = ?`
        )
        .run(newAttempts, id);
      return;
    }

    // Exponential backoff: 2^attempts * 30 seconds
    const backoffMs = Math.pow(2, newAttempts) * 30 * 1000;
    const nextRunAt = new Date(Date.now() + backoffMs).toISOString();

    this.db
      .prepare(
        `UPDATE job_queue
         SET status = 'pending', attempts = ?, next_run_at = ?, started_at = NULL
         WHERE id = ?`
      )
      .run(newAttempts, nextRunAt, id);
  }

  getStats(): JobStats {
    const rows = this.db
      .prepare(
        `SELECT status, COUNT(*) as count
         FROM job_queue
         GROUP BY status`
      )
      .all() as Array<{ status: string; count: number }>;

    const stats: JobStats = {
      pending: 0,
      running: 0,
      done: 0,
      failed: 0,
    };

    for (const row of rows) {
      const status = row.status as JobStatus;
      if (status in stats) {
        stats[status] = row.count;
      }
    }

    return stats;
  }

  cleanup(olderThanDays: number = 7): number {
    const cutoff = new Date(
      Date.now() - olderThanDays * 24 * 60 * 60 * 1000
    ).toISOString();

    const result = this.db
      .prepare(
        `DELETE FROM job_queue
         WHERE status IN ('done', 'failed')
           AND created_at < ?`
      )
      .run(cutoff);

    return result.changes;
  }

  getJob(id: string): Job | undefined {
    return this.db
      .prepare('SELECT * FROM job_queue WHERE id = ?')
      .get(id) as Job | undefined;
  }

  listJobs(
    status?: JobStatus,
    limit: number = 50,
    offset: number = 0
  ): Job[] {
    if (status) {
      return this.db
        .prepare(
          `SELECT * FROM job_queue WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`
        )
        .all(status, limit, offset) as Job[];
    }
    return this.db
      .prepare(
        `SELECT * FROM job_queue ORDER BY created_at DESC LIMIT ? OFFSET ?`
      )
      .all(limit, offset) as Job[];
  }
}
