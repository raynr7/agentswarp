import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { DB } from "../db/client";
import { AgentRunnerService } from "../services/runner";

export const agentsRouter = new Hono();

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  system_prompt: z.string().optional(),
  model: z.string().default("phi3:mini"),
  provider: z.enum(["ollama", "openai", "anthropic", "groq"]).default("ollama"),
  tools: z.array(z.string()).default([]),
  max_iterations: z.number().min(1).max(50).default(10),
  schedule: z.string().optional(),
});

// List all agents
agentsRouter.get("/", async (c) => {
  const agents = DB.query("SELECT * FROM agents ORDER BY created_at DESC").all();
  return c.json(agents);
});

// Get a single agent
agentsRouter.get("/:id", async (c) => {
  const agent = DB.query("SELECT * FROM agents WHERE id = ?").get(c.req.param("id"));
  if (!agent) return c.json({ error: "Not found" }, 404);
  return c.json(agent);
});

// Create an agent
agentsRouter.post("/", zValidator("json", createSchema), async (c) => {
  const body = c.req.valid("json");
  const id = `agent_${Date.now()}`;
  DB.query(
    "INSERT INTO agents (id, name, description, system_prompt, model, provider, tools, max_iterations, schedule) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  
  ).run(id, body.name, body.description ?? null, body.system_prompt ?? null, body.model, body.provider, JSON.stringify(body.tools), body.max_iterations, body.schedule ?? null);
  const agent = DB.query("SELECT * FROM agents WHERE id = ?").get(id);
  return c.json(agent, 201);
});

// Update an agent
agentsRouter.patch("/:id", async (c) => {
  const body = await c.req.json();
  const id = c.req.param("id");
  const fields = Object.keys(body).map(k => `${k} = ?`).join(", ");
  DB.query(`UPDATE agents SET ${fields} WHERE id = ?`).run(...Object.values(body), id);
  const agent = DB.query("SELECT * FROM agents WHERE id = ?").get(id);
  return c.json(agent);
});

// Delete an agent
agentsRouter.delete("/:id", async (c) => {
  DB.query("DELETE FROM agents WHERE id = ?").run(c.req.param("id"));
  return c.json({ ok: true });
});

// Trigger an agent run manually
agentsRouter.post("/:id/run", async (c) => {
  const agent = DB.query("SELECT * FROM agents WHERE id = ?").get(c.req.param("id")) as any;
  if (!agent) return c.json({ error: "Not found" }, 404);
  const { input } = await c.req.json();
  const run = await AgentRunnerService.startRun(agent, input);
  return c.json(run, 202);
});