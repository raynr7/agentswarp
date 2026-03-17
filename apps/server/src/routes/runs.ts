import { Hono } from "hono";
import { DB } from "../db/client";

export const runsRouter = new Hono();

// List runs (optionally filtered by agent)
runsRouter.get("/", async (c) => {
  const agentId = c.req.query("agent_id");
  const limit = parseInt(c.req.query("limit") || "50");
  let runs;
  if (agentId) {
    runs = DB.query("SELECT * FROM runs WHERE agent_id = ? ORDER BY created_at DESC LIMIT ?").all(agentId, limit);
  } else {
    runs = DB.query("SELECT * FROM runs ORDER BY created_at DESC LIMIT ?").all(limit);
  }
  return c.json(runs);
});

// Get a single run with steps
runsRouter.get("/:id", async (c) => {
  const run = DB.query("SELECT * FROM runs WHERE id = ?").get(c.req.param("id"));
  if (!run) return c.json({ error: "Not found" }, 404);
  const steps = DB.query("SELECT * FROM run_steps WHERE run_id = ? ORDER BY step_number ASC").all(c.req.param("id"));
  return c.json({ ...(run as any), steps });
});

// Cancel a run
runsRouter.post("/:id/cancel", async (c) => {
  DB.query("UPDATE runs SET status = 'cancelled' WHERE id = ? AND status = 'running'").run(c.req.param("id"));
  return c.json({ ok: true });
});

// Delete a run
runsRouter.delete("/:id", async (c) => {
  DB.query("DELETE FROM runs WHERE id = ?").run(c.req.param("id"));
  return c.json({ ok: true });
});