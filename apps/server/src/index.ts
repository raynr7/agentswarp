import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { agentsRouter } from "./routes/agents";
import { runsRouter } from "./routes/runs";
import { toolsRouter } from "./routes/tools";
import { integrationsRouter } from "./routes/integrations";
import { webhookRouter } from "./routes/webhooks";
import { setupDatabase } from "./db/setup";
import { SchedulerService } from "./services/scheduler";
import { serveWebsocket } from "./websocket";

const app = new Hono();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

// Health check
app.get("/health", (c) =>
  c.json({ status: "ok", version: "0.1.0", timestamp: new Date().toISOString() })
);

// API routes
app.route("/api/agents", agentsRouter);
app.route("/api/runs", runsRouter);
app.route("/api/tools", toolsRouter);
app.route("/api/integrations", integrationsRouter);
app.route("/webhooks", webhookRouter);

// Init
await setupDatabase();
SchedulerService.start();

console.log(`[AgentSwarp] Server running on port ${PORT}`);

export default {
  port: PORT,
  fetch: app.fetch,
  websocket: serveWebsocket,
};