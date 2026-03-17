import { Hono } from "hono";
import { DB } from "../db/client";
import { AgentRunnerService } from "../services/runner";

type TriggerType = "schedule" | "webhook" | "manual";

interface Trigger {
  id: string;
  agent_id: string;
  type: TriggerType;
  config: string;
  enabled: number;
  last_fired_at: string | null;
  created_at: string;
}

interface CreateTriggerBody {
  agent_id: string;
  type: TriggerType;
  config?: Record<string, unknown>;
}

interface UpdateTriggerBody {
  config?: Record<string, unknown>;
  enabled?: boolean | number;
}

export const triggersRouter = new Hono();

// GET / -- list all triggers (optional ?agent_id=xxx filter)
triggersRouter.get("/", (c) => {
  const agentId = c.req.query("agent_id");

  let triggers: Trigger[];

  if (agentId) {
    triggers = DB.query<Trigger, [string]>(
      "SELECT * FROM triggers WHERE agent_id = ? ORDER BY created_at DESC"
    ).all(agentId);
  } else {
    triggers = DB.query<Trigger, []>(
      "SELECT * FROM triggers ORDER BY created_at DESC"
    ).all();
  }

  const parsed = triggers.map((t) => ({
    ...t,
    config: (() => {
      try {
        return JSON.parse(t.config);
      } catch {
        return {};
      }
    })(),
    enabled: t.enabled === 1,
  }));

  return c.json(parsed);
});

// GET /:id -- get single trigger
triggersRouter.get("/:id", (c) => {
  const id = c.req.param("id");

  const trigger = DB.query<Trigger, [string]>(
    "SELECT * FROM triggers WHERE id = ?"
  ).get(id);

  if (!trigger) {
    return c.json({ error: "Trigger not found" }, 404);
  }

  return c.json({
    ...trigger,
    config: (() => {
      try {
        return JSON.parse(trigger.config);
      } catch {
        return {};
      }
    })(),
    enabled: trigger.enabled === 1,
  });
});

// POST / -- create trigger
triggersRouter.post("/", async (c) => {
  let body: CreateTriggerBody;

  try {
    body = await c.req.json<CreateTriggerBody>();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { agent_id, type, config } = body;

  if (!agent_id || typeof agent_id !== "string") {
    return c.json({ error: "agent_id is required" }, 400);
  }

  if (!type || !["schedule", "webhook", "manual"].includes(type)) {
    return c.json(
      { error: "type must be one of: schedule, webhook, manual" },
      400
    );
  }

  // Verify agent exists
  const agent = DB.query<{ id: string }, [string]>(
    "SELECT id FROM agents WHERE id = ?"
  ).get(agent_id);

  if (!agent) {
    return c.json({ error: "Agent not found" }, 404);
  }

  const id = crypto.randomUUID();
  const configStr = JSON.stringify(config ?? {});
  const now = new Date().toISOString();

  DB.query<void, [string, string, string, string, number, string]>(
    "INSERT INTO triggers (id, agent_id, type, config, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, agent_id, type, configStr, 1, now);

  const created = DB.query<Trigger, [string]>(
    "SELECT * FROM triggers WHERE id = ?"
  ).get(id);

  if (!created) {
    return c.json({ error: "Failed to create trigger" }, 500);
  }

  return c.json(
    {
      ...created,
      config: (() => {
        try {
          return JSON.parse(created.config);
        } catch {
          return {};
        }
      })(),
      enabled: created.enabled === 1,
    },
    201
  );
});

// PUT /:id -- update trigger
triggersRouter.put("/:id", async (c) => {
  const id = c.req.param("id");

  const existing = DB.query<Trigger, [string]>(
    "SELECT * FROM triggers WHERE id = ?"
  ).get(id);

  if (!existing) {
    return c.json({ error: "Trigger not found" }, 404);
  }

  let body: UpdateTriggerBody;

  try {
    body = await c.req.json<UpdateTriggerBody>();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { config, enabled } = body;

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (config !== undefined) {
    updates.push("config = ?");
    values.push(JSON.stringify(config));
  }

  if (enabled !== undefined) {
    updates.push("enabled = ?");
    values.push(enabled ? 1 : 0);
  }

  if (updates.length === 0) {
    return c.json({ error: "No valid fields to update" }, 400);
  }

  values.push(id);

  DB.query<void, (string | number)[]>(
    `UPDATE triggers SET ${updates.join(", ")} WHERE id = ?`
  ).run(...values);

  const updated = DB.query<Trigger, [string]>(
    "SELECT * FROM triggers WHERE id = ?"
  ).get(id);

  if (!updated) {
    return c.json({ error: "Failed to retrieve updated trigger" }, 500);
  }

  return c.json({
    ...updated,
    config: (() => {
      try {
        return JSON.parse(updated.config);
      } catch {
        return {};
      }
    })(),
    enabled: updated.enabled === 1,
  });
});

// DELETE /:id -- delete trigger
triggersRouter.delete("/:id", (c) => {
  const id = c.req.param("id");

  const existing = DB.query<Trigger, [string]>(
    "SELECT * FROM triggers WHERE id = ?"
  ).get(id);

  if (!existing) {
    return c.json({ error: "Trigger not found" }, 404);
  }

  DB.query<void, [string]>("DELETE FROM triggers WHERE id = ?").run(id);

  return c.json({ success: true, id });
});

// POST /:id/fire -- manually fire a trigger
triggersRouter.post("/:id/fire", async (c) => {
  const id = c.req.param("id");

  const trigger = DB.query<Trigger, [string]>(
    "SELECT * FROM triggers WHERE id = ?"
  ).get(id);

  if (!trigger) {
    return c.json({ error: "Trigger not found" }, 404);
  }

  if (!trigger.enabled) {
    return c.json({ error: "Trigger is disabled" }, 400);
  }

  interface Agent {
    id: string;
    name: string;
    system_prompt: string;
    model: string;
    tools: string;
    created_at: string;
  }

  const agent = DB.query<Agent, [string]>(
    "SELECT * FROM agents WHERE id = ?"
  ).get(trigger.agent_id);

  if (!agent) {
    return c.json({ error: "Associated agent not found" }, 404);
  }

  let run: { id: string; [key: string]: unknown };

  try {
    run = await AgentRunnerService.startRun(trigger.agent_id, {
      trigger_id: id,
      trigger_type: trigger.type,
      config: (() => {
        try {
          return JSON.parse(trigger.config);
        } catch {
          return {};
        }
      })(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return c.json({ error: `Failed to start run: ${message}` }, 500);
  }

  const now = new Date().toISOString();

  DB.query<void, [string, string]>(
    "UPDATE triggers SET last_fired_at = ? WHERE id = ?"
  ).run(now, id);

  const updatedTrigger = DB.query<Trigger, [string]>(
    "SELECT * FROM triggers WHERE id = ?"
  ).get(id);

  return c.json({
    success: true,
    run,
    trigger: updatedTrigger
      ? {
          ...updatedTrigger,
          config: (() => {
            try {
              return JSON.parse(updatedTrigger.config);
            } catch {
              return {};
            }
          })(),
          enabled: updatedTrigger.enabled === 1,
        }
      : null,
  });
});
