import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import Database from "better-sqlite3";
import { randomUUID } from "crypto";

// SQLite setup
const db = new Database("agentswarp.db");
db.pragma("journal_mode = WAL");
db.exec(`CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, goal TEXT, status TEXT, result TEXT, created_at TEXT, updated_at TEXT);
CREATE TABLE IF NOT EXISTS memory (id TEXT PRIMARY KEY, key TEXT, value TEXT, created_at TEXT);
CREATE TABLE IF NOT EXISTS agents (id TEXT PRIMARY KEY, name TEXT, status TEXT, last_active TEXT);`);

// Hono app
const app = new Hono();

// API routes
app.get("/api/status", (c) => c.json({ status: "online", version: "2.0.0", uptime: process.uptime() }));

app.get("/api/tasks", (c) => {
  const tasks = db.prepare("SELECT * FROM tasks ORDER BY created_at DESC LIMIT 50").all();
  return c.json({ tasks });
});

app.post("/api/tasks", async (c) => {
  const { goal } = await c.req.json();
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare("INSERT INTO tasks (id, goal, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)").run(id, goal, "pending", now, now);
  return c.json({ id, goal, status: "pending" }, 201);
});

app.get("/api/memory", (c) => {
  const memories = db.prepare("SELECT * FROM memory ORDER BY created_at DESC LIMIT 100").all();
  return c.json({ memories });
});

app.post("/api/memory", async (c) => {
  const { key, value } = await c.req.json();
  const id = randomUUID();
  db.prepare("INSERT INTO memory (id, key, value, created_at) VALUES (?, ?, ?, ?)").run(id, key, value, new Date().toISOString());
  return c.json({ id, key }, 201);
});

app.get("/api/agents", (c) => {
  const agents = db.prepare("SELECT * FROM agents").all();
  return c.json({ agents });
});

// Serve static files
app.use("/*", serveStatic({ root: "./public" }));

// Start server
const port = parseInt(process.env.PORT || "3000");
console.log(`AgentSwarp running on port ${port}`);
export default { port, fetch: app.fetch };
