import { z } from 'zod';
import Database from 'better-sqlite3';
import type { Tool, ToolContext } from '@agentswarm/core';
import { join } from 'path';

const agentDbs = new Map<string, Database.Database>();

function getAgentDb(agentId: string): Database.Database {
  if (agentDbs.has(agentId)) return agentDbs.get(agentId)!;

  const dbPath = join(process.env.DATABASE_URL?.replace(/[^/]+$/, '') || './data', `agent_${agentId}.db`);
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  agentDbs.set(agentId, db);
  return db;
}

export const databaseTool: Tool = {
  name: 'query_database',
  description: 'Run SQL queries against an agent\'s built-in SQLite database. Store and retrieve structured data across runs. Each agent gets its own isolated database.',
  schema: z.object({
    query: z.string(),
    params: z.array(z.unknown()).optional(),
  }),
  async execute(input: any, ctx?: ToolContext) {
    if (!ctx?.agentId) throw new Error('Agent context required for database tool');

    const db = getAgentDb(ctx.agentId);
    const query = input.query.trim();
    const params = input.params || [];

    // Determine if it's a read or write query
    const isRead = /^(SELECT|PRAGMA|EXPLAIN)/i.test(query);

    try {
      if (isRead) {
        const rows = db.prepare(query).all(...params);
        return { success: true, rows, row_count: rows.length };
      } else {
        const result = db.prepare(query).run(...params);
        return {
          success: true,
          changes: result.changes,
          last_insert_rowid: result.lastInsertRowid?.toString(),
        };
      }
    } catch (error) {
      throw new Error(`SQL error: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
};
