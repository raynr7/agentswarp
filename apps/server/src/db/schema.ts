import Database from 'better-sqlite3';
import path from 'path';

export function initDb(dbPath: string): Database.Database {
  const db = new Database(dbPath);

  // Enable WAL mode and foreign keys
  db.exec(`PRAGMA journal_mode = WAL;`);
  db.exec(`PRAGMA foreign_keys = ON;`);

  // --- Existing Tables --------------------------------------------------------

  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      system_prompt TEXT DEFAULT '',
      model TEXT NOT NULL DEFAULT 'gpt-4o',
      temperature REAL DEFAULT 0.7,
      max_tokens INTEGER DEFAULT 4096,
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','running','completed','failed','cancelled')),
      input TEXT DEFAULT '',
      output TEXT DEFAULT '',
      error TEXT,
      started_at TEXT,
      finished_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS run_steps (
      id TEXT PRIMARY KEY,
      run_id TEXT REFERENCES runs(id) ON DELETE CASCADE,
      step_index INTEGER NOT NULL DEFAULT 0,
      type TEXT DEFAULT 'message' CHECK(type IN ('message','tool_call','tool_result','error')),
      content TEXT DEFAULT '',
      tool_name TEXT,
      tool_input TEXT,
      tool_output TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      parameters_schema TEXT DEFAULT '{}',
      handler_path TEXT,
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS agent_memory (
      id TEXT PRIMARY KEY,
      agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK(role IN ('user','assistant','system')),
      content TEXT NOT NULL,
      run_id TEXT REFERENCES runs(id) ON DELETE SET NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // --- ALTER agents: add new columns (idempotent via try/catch) ----------------

  const agentAlterations: string[] = [
    `ALTER TABLE agents ADD COLUMN personality TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE agents ADD COLUMN parent_agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL`,
    `ALTER TABLE agents ADD COLUMN max_sub_agents INTEGER NOT NULL DEFAULT 3`,
    `ALTER TABLE agents ADD COLUMN model_override TEXT`,
  ];

  for (const stmt of agentAlterations) {
    try {
      db.exec(stmt);
    } catch (err: any) {
      // SQLite throws when the column already exists - safe to ignore
      if (
        typeof err?.message === 'string' &&
        err.message.toLowerCase().includes('duplicate column name')
      ) {
        // already migrated, skip
      } else {
        throw err;
      }
    }
  }

  // --- New Tables --------------------------------------------------------------

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT,
      role TEXT DEFAULT 'user' CHECK(role IN ('admin','user')),
      magic_code TEXT,
      magic_code_expires TEXT,
      avatar_url TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      refresh_token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      revoked INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS memory_vectors (
      id TEXT PRIMARY KEY,
      agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      embedding BLOB,
      tier INTEGER DEFAULT 2 CHECK(tier IN (1,2,3)),
      category TEXT DEFAULT 'episodic' CHECK(category IN ('episodic','semantic','procedural')),
      access_count INTEGER DEFAULT 0,
      last_accessed TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY,
      agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      trigger_pattern TEXT,
      action_config TEXT DEFAULT '{}',
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS workspace_files (
      id TEXT PRIMARY KEY,
      agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
      filename TEXT NOT NULL,
      mime_type TEXT DEFAULT 'application/octet-stream',
      size_bytes INTEGER DEFAULT 0,
      storage_path TEXT NOT NULL,
      uploaded_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // --- Indexes -----------------------------------------------------------------

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_runs_agent_id ON runs(agent_id);
    CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
    CREATE INDEX IF NOT EXISTS idx_run_steps_run_id ON run_steps(run_id);
    CREATE INDEX IF NOT EXISTS idx_agent_memory_agent_id ON agent_memory(agent_id);
    CREATE INDEX IF NOT EXISTS idx_agent_memory_run_id ON agent_memory(run_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_memory_vectors_agent_id ON memory_vectors(agent_id);
    CREATE INDEX IF NOT EXISTS idx_memory_vectors_tier ON memory_vectors(tier);
    CREATE INDEX IF NOT EXISTS idx_memory_vectors_category ON memory_vectors(category);
    CREATE INDEX IF NOT EXISTS idx_skills_agent_id ON skills(agent_id);
    CREATE INDEX IF NOT EXISTS idx_skills_enabled ON skills(enabled);
    CREATE INDEX IF NOT EXISTS idx_workspace_files_agent_id ON workspace_files(agent_id);
    CREATE INDEX IF NOT EXISTS idx_workspace_files_uploaded_by ON workspace_files(uploaded_by);
    CREATE INDEX IF NOT EXISTS idx_agents_parent_agent_id ON agents(parent_agent_id);
  `);

  return db;
}

export default initDb;
