import { z, ZodSchema } from 'zod';
import { ToolRegistry, Tool } from './tool-registry';
import { ToolDef } from './types';

export interface MCPClientConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  serverName: string;
}

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: unknown;
}

interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

interface MCPToolInputSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: MCPToolInputSchema;
}

interface MCPResource {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY_MS = 1_000;

function buildZodSchemaFromJsonSchema(inputSchema?: MCPToolInputSchema): ZodSchema {
  if (!inputSchema || inputSchema.type !== 'object' || !inputSchema.properties) {
    return z.object({}).passthrough();
  }

  const shape: Record<string, ZodSchema> = {};
  const required = new Set(inputSchema.required ?? []);

  for (const [key, value] of Object.entries(inputSchema.properties)) {
    const prop = value as Record<string, unknown>;
    let schema: ZodSchema;

    switch (prop['type']) {
      case 'string':
        schema = z.string();
        if (prop['description']) {
          schema = (schema as z.ZodString).describe(prop['description'] as string);
        }
        break;
      case 'number':
      case 'integer':
        schema = z.number();
        if (prop['description']) {
          schema = (schema as z.ZodNumber).describe(prop['description'] as string);
        }
        break;
      case 'boolean':
        schema = z.boolean();
        if (prop['description']) {
          schema = (schema as z.ZodBoolean).describe(prop['description'] as string);
        }
        break;
      case 'array':
        schema = z.array(z.unknown());
        if (prop['description']) {
          schema = schema.describe(prop['description'] as string);
        }
        break;
      case 'object':
        schema = z.object({}).passthrough();
        if (prop['description']) {
          schema = schema.describe(prop['description'] as string);
        }
        break;
      default:
        schema = z.unknown();
        break;
    }

    if (!required.has(key)) {
      schema = schema.optional();
    }

    shape[key] = schema;
  }

  return z.object(shape);
}

export class MCPClient {
  private config: MCPClientConfig;
  private process: ReturnType<typeof Bun.spawn> | null = null;
  private nextId = 1;
  private pending = new Map<number, PendingRequest>();
  private connected = false;
  private reconnectAttempts = 0;
  private buffer = '';
  private readLoopRunning = false;

  constructor(config: MCPClientConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    await this._spawnAndInitialize();
    this.reconnectAttempts = 0;
  }

  private async _spawnAndInitialize(): Promise<void> {
    const env: Record<string, string> = {
      ...Object.fromEntries(
        Object.entries(process.env).filter(([, v]) => v !== undefined) as [string, string][]
      ),
      ...this.config.env,
    };

    this.process = Bun.spawn([this.config.command, ...(this.config.args ?? [])], {
      stdin: 'pipe',
      stdout: 'pipe',
      stderr: 'pipe',
      env,
    });

    this.buffer = '';
    this.readLoopRunning = true;
    this._startReadLoop();
    this._startStderrLoop();

    // Send initialize request
    const result = await this._sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {
        roots: { listChanged: false },
        sampling: {},
      },
      clientInfo: {
        name: 'AgentSwarp',
        version: '1.0.0',
      },
    });

    void result; // Server capabilities stored but not used

    // Send initialized notification
    this._sendNotification('notifications/initialized', {});

    this.connected = true;
  }

  private async _startReadLoop(): Promise<void> {
    if (!this.process?.stdout) return;

    try {
      const reader = this.process.stdout.getReader();
      const decoder = new TextDecoder();

      while (this.readLoopRunning) {
        const { done, value } = await reader.read();
        if (done) {
          this.readLoopRunning = false;
          this._handleDisconnect();
          break;
        }

        this.buffer += decoder.decode(value, { stream: true });
        this._processBuffer();
      }
    } catch (err) {
      if (this.readLoopRunning) {
        console.error(`[MCPClient:${this.config.serverName}] Read loop error:`, err);
        this.readLoopRunning = false;
        this._handleDisconnect();
      }
    }
  }

  private async _startStderrLoop(): Promise<void> {
    if (!this.process?.stderr) return;

    try {
      const reader = this.process.stderr.getReader();
      const decoder = new TextDecoder();

      while (this.readLoopRunning) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        process.stderr.write(`[MCPServer:${this.config.serverName}] ${text}`);
      }
    } catch {
      // Ignore stderr errors
    }
  }

  private _processBuffer(): void {
    const lines = this.buffer.split('\n');
    // Keep last potentially incomplete line in buffer
    this.buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const msg = JSON.parse(trimmed) as JsonRpcResponse;
        this._handleMessage(msg);
      } catch (err) {
        console.error(`[MCPClient:${this.config.serverName}] Failed to parse message:`, trimmed, err);
      }
    }
  }

  private _handleMessage(msg: JsonRpcResponse): void {
    if (msg.id === undefined || msg.id === null) {
      // Notification -- ignore for now
      return;
    }

    const pending = this.pending.get(msg.id);
    if (!pending) {
      console.warn(`[MCPClient:${this.config.serverName}] Received response for unknown id:`, msg.id);
      return;
    }

    clearTimeout(pending.timer);
    this.pending.delete(msg.id);

    if (msg.error) {
      pending.reject(
        new Error(
          `MCP error ${msg.error.code}: ${msg.error.message}${
            msg.error.data ? ` (${JSON.stringify(msg.error.data)})` : ''
          }`
        )
      );
    } else {
      pending.resolve(msg.result);
    }
  }

  private _handleDisconnect(): void {
    if (!this.connected) return;
    this.connected = false;

    // Reject all pending requests
    for (const [id, pending] of this.pending.entries()) {
      clearTimeout(pending.timer);
      pending.reject(new Error(`[MCPClient:${this.config.serverName}] Disconnected`));
      this.pending.delete(id);
    }

    // Attempt reconnect
    if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      this.reconnectAttempts++;
      const delay = RECONNECT_DELAY_MS * this.reconnectAttempts;
      console.warn(
        `[MCPClient:${this.config.serverName}] Disconnected. Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`
      );

      setTimeout(async () => {
        try {
          await this._spawnAndInitialize();
          console.info(`[MCPClient:${this.config.serverName}] Reconnected successfully.`);
        } catch (err) {
          console.error(`[MCPClient:${this.config.serverName}] Reconnect failed:`, err);
          this._handleDisconnect();
        }
      }, delay);
    } else {
      console.error(
        `[MCPClient:${this.config.serverName}] Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`
      );
    }
  }

  private _sendRequest(
    method: string,
    params?: unknown,
    timeoutMs = DEFAULT_TIMEOUT_MS
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!this.process?.stdin) {
        reject(new Error(`[MCPClient:${this.config.serverName}] Not connected`));
        return;
      }

      const id = this.nextId++;
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id,
        method,
        ...(params !== undefined ? { params } : {}),
      };

      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(
          new Error(
            `[MCPClient:${this.config.serverName}] Request timeout for method "${method}" (id=${id})`
          )
        );
      }, timeoutMs);

      this.pending.set(id, { resolve, reject, timer });

      const line = JSON.stringify(request) + '\n';
      this.process.stdin.write(line);
    });
  }

  private _sendNotification(method: string, params?: unknown): void {
    if (!this.process?.stdin) return;

    const notification: JsonRpcNotification = {
      jsonrpc: '2.0',
      method,
      ...(params !== undefined ? { params } : {}),
    };

    const line = JSON.stringify(notification) + '\n';
    this.process.stdin.write(line);
  }

  async disconnect(): Promise<void> {
    this.readLoopRunning = false;
    this.connected = false;
    this.reconnectAttempts = MAX_RECONNECT_ATTEMPTS; // Prevent auto-reconnect

    // Reject pending requests
    for (const [id, pending] of this.pending.entries()) {
      clearTimeout(pending.timer);
      pending.reject(new Error(`[MCPClient:${this.config.serverName}] Client disconnecting`));
      this.pending.delete(id);
    }

    if (this.process) {
      try {
        this.process.kill();
      } catch {
        // Ignore kill errors
      }
      this.process = null;
    }
  }

  async listTools(): Promise<MCPTool[]> {
    if (!this.connected) {
      throw new Error(`[MCPClient:${this.config.serverName}] Not connected`);
    }

    const result = await this._sendRequest('tools/list');
    const response = result as { tools?: MCPTool[] };
    return response.tools ?? [];
  }

  async callTool(name: string, args: object): Promise<unknown> {
    if (!this.connected) {
      throw new Error(`[MCPClient:${this.config.serverName}] Not connected`);
    }

    const result = await this._sendRequest('tools/call', {
      name,
      arguments: args,
    });

    return result;
  }

  async listResources(): Promise<MCPResource[]> {
    if (!this.connected) {
      throw new Error(`[MCPClient:${this.config.serverName}] Not connected`);
    }

    const result = await this._sendRequest('resources/list');
    const response = result as { resources?: MCPResource[] };
    return response.resources ?? [];
  }

  async readResource(uri: string): Promise<unknown> {
    if (!this.connected) {
      throw new Error(`[MCPClient:${this.config.serverName}] Not connected`);
    }

    const result = await this._sendRequest('resources/read', { uri });
    return result;
  }

  async loadToolsIntoRegistry(registry: ToolRegistry): Promise<void> {
    const mcpTools = await this.listTools();

    for (const mcpTool of mcpTools) {
      const schema = buildZodSchemaFromJsonSchema(mcpTool.inputSchema);
      const serverName = this.config.serverName;
      const client = this;

      // Prefix tool name with server name to avoid collisions
      const toolName = `${serverName}__${mcpTool.name}`;

      const tool: Tool<ZodSchema> = {
        name: toolName,
        description: mcpTool.description ?? `Tool ${mcpTool.name} from MCP server ${serverName}`,
        schema,
        execute: async (input: unknown): Promise<unknown> => {
          return client.callTool(mcpTool.name, input as object);
        },
      };

      registry.register(tool);
    }
  }

  get isConnected(): boolean {
    return this.connected;
  }

  get serverName(): string {
    return this.config.serverName;
  }
}

export class MCPClientManager {
  private clients = new Map<string, MCPClient>();

  async addServer(config: MCPClientConfig): Promise<MCPClient> {
    if (this.clients.has(config.serverName)) {
      throw new Error(`MCPClientManager: Server "${config.serverName}" is already registered`);
    }

    const client = new MCPClient(config);
    await client.connect();
    this.clients.set(config.serverName, client);
    return client;
  }

  async removeServer(name: string): Promise<void> {
    const client = this.clients.get(name);
    if (!client) {
      throw new Error(`MCPClientManager: Server "${name}" not found`);
    }

    await client.disconnect();
    this.clients.delete(name);
  }

  async loadAllTools(registry: ToolRegistry): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const client of this.clients.values()) {
      if (client.isConnected) {
        promises.push(client.loadToolsIntoRegistry(registry));
      } else {
        console.warn(
          `MCPClientManager: Server "${client.serverName}" is not connected, skipping tool load.`
        );
      }
    }

    await Promise.all(promises);
  }

  getClient(name: string): MCPClient | undefined {
    return this.clients.get(name);
  }

  get serverNames(): string[] {
    return Array.from(this.clients.keys());
  }

  async disconnectAll(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const client of this.clients.values()) {
      promises.push(client.disconnect());
    }
    await Promise.all(promises);
    this.clients.clear();
  }
}
