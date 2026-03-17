import { Database } from "bun:sqlite";
import { mkdirSync } from "fs";
import { dirname } from "path";

const DB_PATH =
  process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith("postgres")
    ? process.env.DATABASE_URL
    : "./data/agentswarm.db";

// Ensure directory exists
try {
  mkdirSync(dirname(DB_PATH), { recursive: true });
} catch {}

export const DB = new Database(DB_PATH);

// Performance settings
DB.exec("PRAGMA journal_mode = WAL");
DB.exec("PRAGMA synchronous = NORMAL");
DB.exec("PRAGMA cache_size = 10000");
DB.exec("PRAGMA foreign_keys = ON");

console.log(`[db] Connected to ${DB_PATH}`);
