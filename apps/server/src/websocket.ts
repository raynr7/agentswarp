import type { RunStep, Agent } from '@agentswarm/core';

interface WebSocketClient {
  id: string;
  ws: any;
  subscribedRunIds: Set<string>;
  heartbeatInterval: ReturnType<typeof setInterval>;
  lastPong: number;
  isAlive: boolean;
}

interface WsStats {
  totalConnections: number;
  activeSubscriptions: number;
}

class WebSocketManager {
  private clients: Map<string, WebSocketClient> = new Map();
  private readonly HEARTBEAT_INTERVAL_MS = 30_000;
  private readonly PONG_TIMEOUT_MS = 35_000;

  addClient(ws: any): WebSocketClient {
    const id = crypto.randomUUID();
    const now = Date.now();

    const heartbeatInterval = setInterval(() => {
      const client = this.clients.get(id);
      if (!client) return;

      if (Date.now() - client.lastPong > this.PONG_TIMEOUT_MS) {
        console.log(`[WS] Client ${id} timed out (no pong). Removing.`);
        this.forceRemoveClient(id);
        return;
      }

      try {
        client.ws.send(JSON.stringify({ type: 'ping', ts: Date.now() }));
      } catch (err) {
        console.error(`[WS] Failed to send ping to client ${id}:`, err);
        this.forceRemoveClient(id);
      }
    }, this.HEARTBEAT_INTERVAL_MS);

    const client: WebSocketClient = {
      id,
      ws,
      subscribedRunIds: new Set(),
      heartbeatInterval,
      lastPong: now,
      isAlive: true,
    };

    this.clients.set(id, client);
    console.log(`[WS] Client ${id} connected. Total: ${this.clients.size}`);
    return client;
  }

  removeClient(client: WebSocketClient): void {
    this.forceRemoveClient(client.id);
  }

  private forceRemoveClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    clearInterval(client.heartbeatInterval);
    client.subscribedRunIds.clear();
    this.clients.delete(clientId);
    console.log(`[WS] Client ${clientId} disconnected. Total: ${this.clients.size}`);
  }

  subscribe(client: WebSocketClient, runId: string): void {
    const existing = this.clients.get(client.id);
    if (!existing) return;
    existing.subscribedRunIds.add(runId);
    console.log(`[WS] Client ${client.id} subscribed to run ${runId}`);
  }

  unsubscribe(client: WebSocketClient, runId: string): void {
    const existing = this.clients.get(client.id);
    if (!existing) return;
    existing.subscribedRunIds.delete(runId);
    console.log(`[WS] Client ${client.id} unsubscribed from run ${runId}`);
  }

  handlePong(client: WebSocketClient): void {
    const existing = this.clients.get(client.id);
    if (!existing) return;
    existing.lastPong = Date.now();
    existing.isAlive = true;
  }

  broadcastStep(runId: string, step: RunStep): void {
    const message = JSON.stringify({ type: 'step', runId, step });
    for (const [clientId, client] of this.clients) {
      if (client.subscribedRunIds.has(runId)) {
        try {
          client.ws.send(message);
        } catch (err) {
          console.error(`[WS] Failed to send step to client ${clientId}:`, err);
          this.forceRemoveClient(clientId);
        }
      }
    }
  }

  broadcastRunComplete(runId: string, status: string): void {
    const message = JSON.stringify({ type: 'run_complete', runId, status });
    for (const [clientId, client] of this.clients) {
      if (client.subscribedRunIds.has(runId)) {
        try {
          client.ws.send(message);
        } catch (err) {
          console.error(`[WS] Failed to send run_complete to client ${clientId}:`, err);
          this.forceRemoveClient(clientId);
          continue;
        }
        client.subscribedRunIds.delete(runId);
      }
    }
  }

  broadcastAgentUpdate(agent: Agent): void {
    const message = JSON.stringify({ type: 'agent_update', agent });
    for (const [clientId, client] of this.clients) {
      try {
        client.ws.send(message);
      } catch (err) {
        console.error(`[WS] Failed to send agent_update to client ${clientId}:`, err);
        this.forceRemoveClient(clientId);
      }
    }
  }

  handleMessage(client: WebSocketClient, data: string): void {
    try {
      const msg = JSON.parse(data);
      switch (msg.type) {
        case 'subscribe':
          if (typeof msg.runId === 'string' && msg.runId) {
            this.subscribe(client, msg.runId);
          }
          break;
        case 'unsubscribe':
          if (typeof msg.runId === 'string' && msg.runId) {
            this.unsubscribe(client, msg.runId);
          }
          break;
        case 'pong':
          this.handlePong(client);
          break;
        default:
          console.warn(`[WS] Unknown message type from client ${client.id}: ${msg.type}`);
      }
    } catch (err) {
      console.error(`[WS] Failed to parse message from client ${client.id}:`, err);
    }
  }

  getStats(): WsStats {
    let activeSubscriptions = 0;
    for (const client of this.clients.values()) {
      activeSubscriptions += client.subscribedRunIds.size;
    }
    return {
      totalConnections: this.clients.size,
      activeSubscriptions,
    };
  }

  getClientById(clientId: string): WebSocketClient | undefined {
    return this.clients.get(clientId);
  }
}

export type { WebSocketClient, WsStats };
export const wsManager = new WebSocketManager();
