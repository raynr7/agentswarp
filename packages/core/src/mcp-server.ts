import { globalRegistry } from './tool-registry';
import type { ToolContext } from './types';
import * as readline from 'readline';

// JSON-RPC 2.0 types
interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number | string;
  result?: unknown;
  error?: JsonRpcError;
}

interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// JSON-RPC error codes
const ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;

// MCP types
interface McpTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
}

interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

interface McpServerCapabilities {
  tools?: { listChanged?: boolean };
  resources?: { subscribe?: boolean; listChanged?: boolean };
  logging?: Record<string, unknown>;
}

interface McpInitializeResult {
  protocolVersion: string;
  capabilities: McpServerCapabilities;
  serverInfo: {
    name: string;
    version: string;
  };
  instructions?: string;
}

interface McpToolsListResult {
  tools: McpTool[];
}

interface McpToolsCallResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

interface McpResourcesListResult {
  resources: McpResource[];
}

interface McpResourcesReadResult {
  contents: Array<{
    uri: string;
    mimeType?: string;
    text?: string;
    blob?: string;
  }>;
}

type IncomingMessage = JsonRpcRequest | JsonRpcNotification;

function isRequest(msg: IncomingMessage): msg is JsonRpcRequest {
  return 'id' in msg;
}

export class MCPServer {
  private readonly serverName: string;
  private readonly serverVersion: string;
  private readonly protocolVersion: string = '2024-11-05';
  private running: boolean = false;
  private rl: readline.Interface | null = null;
  private defaultContext: ToolContext;
  private initialized: boolean = false;

  constructor(
    options: {
      name?: string;
      version?: string;
      defaultContext?: Partial<ToolContext>;
    } = {}
  ) {
    this.serverName = options.name ?? 'AgentSwarp MCP Server';
    this.serverVersion = options.version ?? '1.0.0';
    this.defaultContext = {
      agentId: options.defaultContext?.agentId ?? 'mcp-server',
      runId: options.defaultContext?.runId ?? `run-${Date.now()}`,
      db: options.defaultContext?.db ?? ({} as ToolContext['db']),
    };
  }

  start(): void {
    if (this.running) {
      throw new Error('MCPServer is already running');
    }

    this.running = true;

    this.rl = readline.createInterface({
      input: process.stdin,
      output: undefined,
      terminal: false,
    });

    this.rl.on('line', (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      this.processLine(trimmed);
    });

    this.rl.on('close', () => {
      this.running = false;
    });

    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
  }

  private processLine(line: string): void {
    let parsed: unknown;

    try {
      parsed = JSON.parse(line);
    } catch {
      this.writeError(null, ERROR_CODES.PARSE_ERROR, 'Parse error: invalid JSON');
      return;
    }

    if (!this.isValidMessage(parsed)) {
      this.writeError(
        this.extractId(parsed),
        ERROR_CODES.INVALID_REQUEST,
        'Invalid Request: not a valid JSON-RPC 2.0 message'
      );
      return;
    }

    this.handleMessage(parsed).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      if (isRequest(parsed as IncomingMessage)) {
        this.writeError(
          (parsed as JsonRpcRequest).id,
          ERROR_CODES.INTERNAL_ERROR,
          `Internal error: ${msg}`
        );
      }
    });
  }

  async handleMessage(message: IncomingMessage): Promise<void> {
    if (!isRequest(message)) {
      // It's a notification -- handle it but don't respond
      await this.handleNotification(message);
      return;
    }

    const request = message;

    try {
      const result = await this.dispatchMethod(request);
      this.writeResponse(request.id, result);
    } catch (err: unknown) {
      if (err instanceof McpError) {
        this.writeError(request.id, err.code, err.message, err.data);
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        this.writeError(request.id, ERROR_CODES.INTERNAL_ERROR, `Internal error: ${msg}`);
      }
    }
  }

  private async dispatchMethod(request: JsonRpcRequest): Promise<unknown> {
    switch (request.method) {
      case 'initialize':
        return this.handleInitialize(request);
      case 'tools/list':
        return this.handleToolsList(request);
      case 'tools/call':
        return this.handleToolsCall(request);
      case 'resources/list':
        return this.handleResourcesList(request);
      case 'resources/read':
        return this.handleResourcesRead(request);
      case 'ping':
        return this.handlePing();
      default:
        throw new McpError(
          ERROR_CODES.METHOD_NOT_FOUND,
          `Method not found: ${request.method}`
        );
    }
  }

  private async handleNotification(notification: JsonRpcNotification): Promise<void> {
    switch (notification.method) {
      case 'notifications/initialized':
        this.initialized = true;
        break;
      // Silently ignore unknown notifications per JSON-RPC 2.0 spec
      default:
        break;
    }
  }

  // --- MCP Method Handlers -------------------------------------------------

  private handleInitialize(request: JsonRpcRequest): McpInitializeResult {
    const params = request.params as {
      protocolVersion?: string;
      clientInfo?: { name: string; version: string };
      capabilities?: Record<string, unknown>;
    } | undefined;

    if (!params?.protocolVersion) {
      throw new McpError(
        ERROR_CODES.INVALID_PARAMS,
        'Invalid params: protocolVersion is required'
      );
    }

    return {
      protocolVersion: this.protocolVersion,
      capabilities: {
        tools: { listChanged: true },
        resources: { subscribe: false, listChanged: false },
        logging: {},
      },
      serverInfo: {
        name: this.serverName,
        version: this.serverVersion,
      },
      instructions:
        'AgentSwarp MCP Server exposes registered agent tools. Use tools/list to discover available tools and tools/call to execute them.',
    };
  }

  private handleToolsList(_request: JsonRpcRequest): McpToolsListResult {
    const toolDefs = globalRegistry.list();
    const tools: McpTool[] = toolDefs.map((tool) => this.convertToMcpTool(tool));
    return { tools };
  }

  private async handleToolsCall(request: JsonRpcRequest): Promise<McpToolsCallResult> {
    const params = request.params as {
      name?: unknown;
      arguments?: unknown;
    } | undefined;

    if (!params?.name || typeof params.name !== 'string') {
      throw new McpError(
        ERROR_CODES.INVALID_PARAMS,
        'Invalid params: tool name is required and must be a string'
      );
    }

    const toolName = params.name;
    const toolArgs = (params.arguments ?? {}) as Record<string, unknown>;

    if (!globalRegistry.has(toolName)) {
      throw new McpError(
        ERROR_CODES.INVALID_PARAMS,
        `Tool not found: ${toolName}`
      );
    }

    try {
      const result = await globalRegistry.executeByName(
        toolName,
        toolArgs,
        this.defaultContext
      );

      return this.convertToMcpResult(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [
          {
            type: 'text',
            text: `Error executing tool '${toolName}': ${message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private handleResourcesList(_request: JsonRpcRequest): McpResourcesListResult {
    // Expose each registered tool as a resource for discoverability
    const toolDefs = globalRegistry.list();
    const resources: McpResource[] = toolDefs.map((tool) => ({
      uri: `agentswarp://tools/${encodeURIComponent(tool.name)}`,
      name: tool.name,
      description: tool.description,
      mimeType: 'application/json',
    }));

    // Add a special resource for the tool registry overview
    resources.unshift({
      uri: 'agentswarp://registry',
      name: 'Tool Registry',
      description: 'Overview of all registered AgentSwarp tools',
      mimeType: 'application/json',
    });

    return { resources };
  }

  private handleResourcesRead(request: JsonRpcRequest): McpResourcesReadResult {
    const params = request.params as { uri?: unknown } | undefined;

    if (!params?.uri || typeof params.uri !== 'string') {
      throw new McpError(
        ERROR_CODES.INVALID_PARAMS,
        'Invalid params: uri is required and must be a string'
      );
    }

    const uri = params.uri;

    if (uri === 'agentswarp://registry') {
      const toolDefs = globalRegistry.list();
      const overview = {
        totalTools: toolDefs.length,
        tools: toolDefs.map((t) => ({
          name: t.name,
          description: t.description,
          parameterCount: Object.keys(t.parameters?.properties ?? {}).length,
        })),
      };
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(overview, null, 2),
          },
        ],
      };
    }

    const toolPrefix = 'agentswarp://tools/';
    if (uri.startsWith(toolPrefix)) {
      const toolName = decodeURIComponent(uri.slice(toolPrefix.length));
      const tool = globalRegistry.get(toolName);

      if (!tool) {
        throw new McpError(
          ERROR_CODES.INVALID_PARAMS,
          `Resource not found: ${uri}`
        );
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(
              {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
                inputSchema: this.convertToMcpTool(tool).inputSchema,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    throw new McpError(
      ERROR_CODES.INVALID_PARAMS,
      `Resource not found: ${uri}`
    );
  }

  private handlePing(): Record<string, never> {
    return {};
  }

  // --- Conversion Helpers --------------------------------------------------

  private convertToMcpTool(tool: { name: string; description: string; parameters?: Record<string, unknown> }): McpTool {
    // Normalize the parameters into a JSON Schema object shape
    const rawParams = tool.parameters ?? {};

    let properties: Record<string, unknown> = {};
    let required: string[] = [];
    let additionalProperties: boolean | undefined;

    if (
      rawParams['type'] === 'object' &&
      rawParams['properties'] !== undefined
    ) {
      // Already a JSON Schema object
      properties = (rawParams['properties'] as Record<string, unknown>) ?? {};
      if (Array.isArray(rawParams['required'])) {
        required = rawParams['required'] as string[];
      }
      if (typeof rawParams['additionalProperties'] === 'boolean') {
        additionalProperties = rawParams['additionalProperties'];
      }
    } else if (Object.keys(rawParams).length > 0) {
      // Treat the raw object as a flat property map
      properties = rawParams;
    }

    const inputSchema: McpTool['inputSchema'] = {
      type: 'object',
      properties,
    };

    if (required.length > 0) {
      inputSchema.required = required;
    }

    if (additionalProperties !== undefined) {
      inputSchema.additionalProperties = additionalProperties;
    }

    return {
      name: tool.name,
      description: tool.description,
      inputSchema,
    };
  }

  private convertToMcpResult(result: unknown): McpToolsCallResult {
    if (result === null || result === undefined) {
      return {
        content: [{ type: 'text', text: '' }],
      };
    }

    if (typeof result === 'string') {
      return {
        content: [{ type: 'text', text: result }],
      };
    }

    if (typeof result === 'number' || typeof result === 'boolean') {
      return {
        content: [{ type: 'text', text: String(result) }],
      };
    }

    // Object or array -- serialize as JSON
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  // --- Transport Helpers ---------------------------------------------------

  private writeResponse(id: number | string, result: unknown): void {
    const response: JsonRpcResponse = {
      jsonrpc: '2.0',
      id,
      result,
    };
    this.writeLine(response);
  }

  private writeError(
    id: number | string | null,
    code: number,
    message: string,
    data?: unknown
  ): void {
    const error: JsonRpcError = { code, message };
    if (data !== undefined) {
      error.data = data;
    }

    const response: JsonRpcResponse = {
      jsonrpc: '2.0',
      id: id ?? 0,
      error,
    };
    this.writeLine(response);
  }

  sendNotification(method: string, params?: Record<string, unknown>): void {
    const notification: JsonRpcNotification = {
      jsonrpc: '2.0',
      method,
    };
    if (params !== undefined) {
      notification.params = params;
    }
    this.writeLine(notification);
  }

  private writeLine(obj: unknown): void {
    const line = JSON.stringify(obj);
    process.stdout.write(line + '\n');
  }

  // --- Validation Helpers --------------------------------------------------

  private isValidMessage(value: unknown): value is IncomingMessage {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false;
    }
    const obj = value as Record<string, unknown>;
    if (obj['jsonrpc'] !== '2.0') return false;
    if (typeof obj['method'] !== 'string') return false;
    return true;
  }

  private extractId(value: unknown): number | string | null {
    if (typeof value !== 'object' || value === null) return null;
    const obj = value as Record<string, unknown>;
    const id = obj['id'];
    if (typeof id === 'number' || typeof id === 'string') return id;
    return null;
  }
}

// --- Custom Error Class ----------------------------------------------------

class McpError extends Error {
  readonly code: number;
  readonly data?: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = 'McpError';
    this.code = code;
    this.data = data;
  }
}

// --- Default Export --------------------------------------------------------

export default MCPServer;
