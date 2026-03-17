import type Database from 'better-sqlite3';

export class AgentMemory {
  constructor(private agentId: string, private db: Database.Database) {}

  async get(key: string): Promise<string | null> {
    const row = this.db.prepare(
      'SELECT value FROM agent_memory WHERE agent_id = ? AND key = ?'
    ).get(this.agentId, key) as { value: string } | undefined;
    return row?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.db.prepare(`
      INSERT INTO agent_memory (id, agent_id, key, value, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(agent_id, key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(crypto.randomUUID(), this.agentId, key, value);
  }

  async getAll(): Promise<Record<string, string>> {
    const rows = this.db.prepare(
      'SELECT key, value FROM agent_memory WHERE agent_id = ?'
    ).all(this.agentId) as { key: string; value: string }[];
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  }

  async delete(key: string): Promise<void> {
    this.db.prepare(
      'DELETE FROM agent_memory WHERE agent_id = ? AND key = ?'
    ).run(this.agentId, key);
  }

  async summarize(): Promise<string> {
    const all = await this.getAll();
    const entries = Object.entries(all);
    if (entries.length === 0) return 'No stored memory.';
    return 'Agent Memory:\n' + entries.map(([k, v]) => `  ${k}: ${v}`).join('\n');
  }
}
