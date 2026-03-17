import { initDb } from './schema';

const dbPath = process.env.DATABASE_URL || './data/agentswarm.db';

// Ensure data directory exists
import { mkdirSync } from 'fs';
import { dirname } from 'path';
try { mkdirSync(dirname(dbPath), { recursive: true }); } catch {}

export const db = initDb(dbPath);
