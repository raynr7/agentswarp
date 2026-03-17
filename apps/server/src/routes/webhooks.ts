import { Hono } from "hono";
import { DB } from "../db/client";
import { AgentRunnerService } from "../services/runner";

export const webhookRouter = new Hono();

interface TriggerConfig {
  secret?: string;
  [key: string]: unknown;
}

async function verifyHmacSignature(
  secret: string,
  body: string,
  signatureHeader: string | null
): Promise<boolean> {
  if (!signatureHeader) {
    return false;
  }

  const prefix = "sha256=";
  if (!signatureHeader.startsWith(prefix)) {
    return false;
  }

  const providedHex = signatureHeader.slice(prefix.length);

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(body);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const signatureBytes = new Uint8Array(signatureBuffer);
  const computedHex = Array.from(signatureBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Constant-time comparison
  if (computedHex.length !== providedHex.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < computedHex.length; i++) {
    mismatch |= computedHex.charCodeAt(i) ^ providedHex.charCodeAt(i);
  }

  return mismatch === 0;
}

webhookRouter.post("/:triggerId", async (c) => {
  const { triggerId } = c.req.param();

  // Read raw body for signature verification
  const rawBody = await c.req.text();

  // Look up trigger
  const db = DB.getInstance();

  const trigger = await db
    .selectFrom("triggers")
    .selectAll()
    .where("id", "=", triggerId)
    .executeTakeFirst();

  if (!trigger) {
    return c.json({ ok: false, error: "Trigger not found" }, 404);
  }

  if (!trigger.enabled) {
    return c.json({ ok: false, error: "Trigger is disabled" }, 403);
  }

  if (trigger.type !== "webhook") {
    return c.json({ ok: false, error: "Trigger is not of type webhook" }, 400);
  }

  // Parse config
  let config: TriggerConfig = {};
  if (trigger.config) {
    try {
      config =
        typeof trigger.config === "string"
          ? (JSON.parse(trigger.config) as TriggerConfig)
          : (trigger.config as TriggerConfig);
    } catch {
      config = {};
    }
  }

  // Verify HMAC signature if secret is configured
  if (config.secret) {
    const signatureHeader = c.req.header("X-Webhook-Signature") ?? null;
    const isValid = await verifyHmacSignature(config.secret, rawBody, signatureHeader);
    if (!isValid) {
      return c.json({ ok: false, error: "Invalid signature" }, 401);
    }
  }

  // Look up associated agent
  const agent = await db
    .selectFrom("agents")
    .selectAll()
    .where("id", "=", trigger.agent_id)
    .executeTakeFirst();

  if (!agent) {
    return c.json({ ok: false, error: "Associated agent not found" }, 404);
  }

  if (!agent.enabled) {
    return c.json({ ok: false, error: "Associated agent is disabled" }, 403);
  }

  // Parse body for passing to runner
  let parsedBody: unknown = rawBody;
  const contentType = c.req.header("content-type") ?? "";
  if (contentType.includes("application/json") && rawBody.trim().length > 0) {
    try {
      parsedBody = JSON.parse(rawBody) as unknown;
    } catch {
      parsedBody = rawBody;
    }
  }

  // Start agent run
  let runResult: Awaited<ReturnType<typeof AgentRunnerService.startRun>>;
  try {
    runResult = await AgentRunnerService.startRun(agent, parsedBody);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start run";
    return c.json({ ok: false, error: message }, 500);
  }

  // Update last_fired_at
  await db
    .updateTable("triggers")
    .set({ last_fired_at: new Date().toISOString() })
    .where("id", "=", triggerId)
    .execute();

  return c.json({ ok: true, runId: runResult.runId }, 200);
});
