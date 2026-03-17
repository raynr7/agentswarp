import { Hono } from "hono";
import { DB } from "../db/client";

export const integrationsRouter = new Hono();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IntegrationRow {
  id: string;
  name: string;
  type: string;
  config: string;
  enabled: number;
  created_at: string;
  updated_at: string;
}

interface IntegrationConfig {
  api_key?: string;
  token?: string;
  secret?: string;
  base_url?: string;
  [key: string]: unknown;
}

interface IntegrationResponse {
  id: string;
  name: string;
  type: string;
  config: IntegrationConfig;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SENSITIVE_KEYS: ReadonlyArray<string> = ["api_key", "token", "secret"];

function maskSensitive(config: IntegrationConfig): IntegrationConfig {
  const masked: IntegrationConfig = { ...config };
  for (const key of SENSITIVE_KEYS) {
    if (typeof masked[key] === "string" && (masked[key] as string).length > 0) {
      const value = masked[key] as string;
      masked[key] =
        value.length <= 4
          ? "****"
          : `****${value.slice(-4)}`;
    }
  }
  return masked;
}

function parseConfig(raw: string): IntegrationConfig {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as IntegrationConfig;
    }
    return {};
  } catch {
    return {};
  }
}

function rowToResponse(row: IntegrationRow): IntegrationResponse {
  const config = parseConfig(row.config);
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    config: maskSensitive(config),
    enabled: row.enabled === 1,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function now(): string {
  return new Date().toISOString();
}

// ---------------------------------------------------------------------------
// Integration tester
// ---------------------------------------------------------------------------

interface TestResult {
  success: boolean;
  message: string;
}

async function testIntegration(
  type: string,
  config: IntegrationConfig
): Promise<TestResult> {
  try {
    switch (type) {
      case "ollama": {
        const base = typeof config.base_url === "string" && config.base_url.length > 0
          ? config.base_url.replace(/\/$/, "")
          : "http://localhost:11434";
        const response = await fetch(`${base}/api/tags`, {
          signal: AbortSignal.timeout(5000),
        });
        if (!response.ok) {
          return { success: false, message: `Ollama returned HTTP ${response.status}` };
        }
        return { success: true, message: "Ollama is reachable and responding" };
      }

      case "openai": {
        if (typeof config.api_key !== "string" || config.api_key.length === 0) {
          return { success: false, message: "api_key is required for OpenAI" };
        }
        const base = typeof config.base_url === "string" && config.base_url.length > 0
          ? config.base_url.replace(/\/$/, "")
          : "https://api.openai.com/v1";
        const response = await fetch(`${base}/models`, {
          headers: { Authorization: `Bearer ${config.api_key}` },
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) {
          const body = await response.text();
          return {
            success: false,
            message: `OpenAI API returned HTTP ${response.status}: ${body.slice(0, 200)}`,
          };
        }
        return { success: true, message: "OpenAI credentials are valid" };
      }

      case "anthropic": {
        if (typeof config.api_key !== "string" || config.api_key.length === 0) {
          return { success: false, message: "api_key is required for Anthropic" };
        }
        const response = await fetch("https://api.anthropic.com/v1/models", {
          headers: {
            "x-api-key": config.api_key,
            "anthropic-version": "2023-06-01",
          },
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) {
          const body = await response.text();
          return {
            success: false,
            message: `Anthropic API returned HTTP ${response.status}: ${body.slice(0, 200)}`,
          };
        }
        return { success: true, message: "Anthropic credentials are valid" };
      }

      case "groq": {
        if (typeof config.api_key !== "string" || config.api_key.length === 0) {
          return { success: false, message: "api_key is required for Groq" };
        }
        const response = await fetch("https://api.groq.com/openai/v1/models", {
          headers: { Authorization: `Bearer ${config.api_key}` },
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) {
          const body = await response.text();
          return {
            success: false,
            message: `Groq API returned HTTP ${response.status}: ${body.slice(0, 200)}`,
          };
        }
        return { success: true, message: "Groq credentials are valid" };
      }

      case "slack": {
        const apiToken = config.api_key ?? config.token;
        if (typeof apiToken !== "string" || apiToken.length === 0) {
          return { success: false, message: "api_key or token is required for Slack" };
        }
        const response = await fetch("https://slack.com/api/auth.test", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiToken}` },
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) {
          return {
            success: false,
            message: `Slack API returned HTTP ${response.status}`,
          };
        }
        const data = (await response.json()) as { ok: boolean; error?: string };
        if (!data.ok) {
          return {
            success: false,
            message: `Slack auth failed: ${data.error ?? "unknown error"}`,
          };
        }
        return { success: true, message: "Slack credentials are valid" };
      }

      case "github": {
        const apiToken = config.api_key ?? config.token;
        if (typeof apiToken !== "string" || apiToken.length === 0) {
          return { success: false, message: "api_key or token is required for GitHub" };
        }
        const response = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `token ${apiToken}`,
            Accept: "application/vnd.github.v3+json",
          },
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) {
          return {
            success: false,
            message: `GitHub API returned HTTP ${response.status}`,
          };
        }
        const data = (await response.json()) as { login?: string };
        return {
          success: true,
          message: `GitHub credentials valid${data.login ? ` (user: ${data.login})` : ""}`,
        };
      }

      default:
        return {
          success: false,
          message: `Testing is not supported for integration type "${type}"`,
        };
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unknown error during connection test";
    return { success: false, message };
  }
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET / -- list all integrations
integrationsRouter.get("/", (c) => {
  const rows = DB.query<IntegrationRow, []>(
    "SELECT id, name, type, config, enabled, created_at, updated_at FROM integrations ORDER BY created_at DESC"
  ).all();

  return c.json(rows.map(rowToResponse));
});

// GET /:id -- get single integration
integrationsRouter.get("/:id", (c) => {
  const { id } = c.req.param();

  const row = DB.query<IntegrationRow, [string]>(
    "SELECT id, name, type, config, enabled, created_at, updated_at FROM integrations WHERE id = ?"
  ).get(id);

  if (!row) {
    return c.json({ error: "Integration not found" }, 404);
  }

  return c.json(rowToResponse(row));
});

// POST / -- create integration
integrationsRouter.post("/", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return c.json({ error: "Request body must be an object" }, 400);
  }

  const input = body as Record<string, unknown>;

  if (typeof input.name !== "string" || input.name.trim().length === 0) {
    return c.json({ error: "\"name\" is required and must be a non-empty string" }, 400);
  }

  if (typeof input.type !== "string" || input.type.trim().length === 0) {
    return c.json({ error: "\"type\" is required and must be a non-empty string" }, 400);
  }

  let config: IntegrationConfig = {};
  if (input.config !== undefined) {
    if (
      input.config === null ||
      typeof input.config !== "object" ||
      Array.isArray(input.config)
    ) {
      return c.json({ error: "\"config\" must be an object" }, 400);
    }
    config = input.config as IntegrationConfig;
  }

  const enabled =
    typeof input.enabled === "boolean"
      ? input.enabled
      : typeof input.enabled === "number"
      ? input.enabled !== 0
      : true;

  const id = crypto.randomUUID();
  const ts = now();

  DB.query<void, [string, string, string, string, number, string, string]>(
    "INSERT INTO integrations (id, name, type, config, enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, input.name.trim(), input.type.trim(), JSON.stringify(config), enabled ? 1 : 0, ts, ts);

  const created = DB.query<IntegrationRow, [string]>(
    "SELECT id, name, type, config, enabled, created_at, updated_at FROM integrations WHERE id = ?"
  ).get(id);

  if (!created) {
    return c.json({ error: "Failed to create integration" }, 500);
  }

  return c.json(rowToResponse(created), 201);
});

// PATCH /:id -- update integration fields
integrationsRouter.patch("/:id", async (c) => {
  const { id } = c.req.param();

  const existing = DB.query<IntegrationRow, [string]>(
    "SELECT id, name, type, config, enabled, created_at, updated_at FROM integrations WHERE id = ?"
  ).get(id);

  if (!existing) {
    return c.json({ error: "Integration not found" }, 404);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return c.json({ error: "Request body must be an object" }, 400);
  }

  const input = body as Record<string, unknown>;

  const updates: string[] = [];
  const values: (string | number)[] = [];

  if (input.name !== undefined) {
    if (typeof input.name !== "string" || input.name.trim().length === 0) {
      return c.json({ error: "\"name\" must be a non-empty string" }, 400);
    }
    updates.push("name = ?");
    values.push(input.name.trim());
  }

  if (input.type !== undefined) {
    if (typeof input.type !== "string" || input.type.trim().length === 0) {
      return c.json({ error: "\"type\" must be a non-empty string" }, 400);
    }
    updates.push("type = ?");
    values.push(input.type.trim());
  }

  if (input.config !== undefined) {
    if (
      input.config === null ||
      typeof input.config !== "object" ||
      Array.isArray(input.config)
    ) {
      return c.json({ error: "\"config\" must be an object" }, 400);
    }
    // Merge with existing config so callers can do partial updates
    const existingConfig = parseConfig(existing.config);
    const mergedConfig: IntegrationConfig = {
      ...existingConfig,
      ...(input.config as IntegrationConfig),
    };
    updates.push("config = ?");
    values.push(JSON.stringify(mergedConfig));
  }

  if (input.enabled !== undefined) {
    if (typeof input.enabled !== "boolean" && typeof input.enabled !== "number") {
      return c.json({ error: "\"enabled\" must be a boolean" }, 400);
    }
    const enabledValue =
      typeof input.enabled === "boolean" ? input.enabled : input.enabled !== 0;
    updates.push("enabled = ?");
    values.push(enabledValue ? 1 : 0);
  }

  if (updates.length === 0) {
    return c.json({ error: "No updatable fields provided" }, 400);
  }

  const ts = now();
  updates.push("updated_at = ?");
  values.push(ts);
  values.push(id);

  DB.query<void, (string | number)[]>(
    `UPDATE integrations SET ${updates.join(", ")} WHERE id = ?`
  ).run(...values);

  const updated = DB.query<IntegrationRow, [string]>(
    "SELECT id, name, type, config, enabled, created_at, updated_at FROM integrations WHERE id = ?"
  ).get(id);

  if (!updated) {
    return c.json({ error: "Failed to retrieve updated integration" }, 500);
  }

  return c.json(rowToResponse(updated));
});

// DELETE /:id -- delete integration
integrationsRouter.delete("/:id", (c) => {
  const { id } = c.req.param();

  const existing = DB.query<IntegrationRow, [string]>(
    "SELECT id FROM integrations WHERE id = ?"
  ).get(id);

  if (!existing) {
    return c.json({ error: "Integration not found" }, 404);
  }

  DB.query<void, [string]>("DELETE FROM integrations WHERE id = ?").run(id);

  return c.json({ success: true, id });
});

// POST /:id/test -- test integration connection
integrationsRouter.post("/:id/test", async (c) => {
  const { id } = c.req.param();

  const row = DB.query<IntegrationRow, [string]>(
    "SELECT id, name, type, config, enabled, created_at, updated_at FROM integrations WHERE id = ?"
  ).get(id);

  if (!row) {
    return c.json({ error: "Integration not found" }, 404);
  }

  if (row.enabled === 0) {
    return c.json({ success: false, message: "Integration is disabled" }, 400);
  }

  const config = parseConfig(row.config);
  const result = await testIntegration(row.type, config);

  const statusCode = result.success ? 200 : 422;
  return c.json(result, statusCode);
});
