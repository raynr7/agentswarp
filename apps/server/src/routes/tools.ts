import { Hono } from "hono";

interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
}

const BUILT_IN_TOOLS: ToolDefinition[] = [
  {
    name: "web_search",
    description: "Search the web using a query string",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to execute",
        },
        num_results: {
          type: "number",
          description: "Number of results to return (default: 10)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "send_email",
    description: "Send an email to a recipient",
    parameters: {
      type: "object",
      properties: {
        to: {
          type: "string",
          description: "The recipient email address",
        },
        subject: {
          type: "string",
          description: "The email subject line",
        },
        body: {
          type: "string",
          description: "The email body content",
        },
        cc: {
          type: "string",
          description: "Optional CC email address",
        },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "read_file",
    description: "Read the contents of a file",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The file path to read",
        },
        encoding: {
          type: "string",
          description: "File encoding (default: utf-8)",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Write content to a file",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "The file path to write to",
        },
        content: {
          type: "string",
          description: "The content to write to the file",
        },
        append: {
          type: "boolean",
          description: "Whether to append to the file instead of overwriting (default: false)",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "shell",
    description: "Execute a shell command",
    parameters: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The shell command to execute",
        },
        cwd: {
          type: "string",
          description: "Working directory for the command",
        },
        timeout: {
          type: "number",
          description: "Timeout in milliseconds (default: 30000)",
        },
      },
      required: ["command"],
    },
  },
  {
    name: "http_request",
    description: "Make an HTTP request to a URL",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL to make the request to",
        },
        method: {
          type: "string",
          description: "HTTP method (GET, POST, PUT, DELETE, PATCH, etc.)",
        },
        headers: {
          type: "object",
          description: "Optional HTTP headers as key-value pairs",
        },
        body: {
          type: "string",
          description: "Optional request body",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "code_eval",
    description: "Evaluate JavaScript code",
    parameters: {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "The JavaScript code to evaluate",
        },
        timeout: {
          type: "number",
          description: "Timeout in milliseconds (default: 5000)",
        },
      },
      required: ["code"],
    },
  },
  {
    name: "vector_search",
    description: "Search a vector store for similar documents",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query to find similar documents",
        },
        collection: {
          type: "string",
          description: "The vector collection or index to search",
        },
        top_k: {
          type: "number",
          description: "Number of top results to return (default: 5)",
        },
        threshold: {
          type: "number",
          description: "Minimum similarity threshold (0.0 to 1.0)",
        },
      },
      required: ["query", "collection"],
    },
  },
];

const toolsByName: Map<string, ToolDefinition> = new Map(
  BUILT_IN_TOOLS.map((tool) => [tool.name, tool])
);

export const toolsRouter = new Hono();

toolsRouter.get("/", (c) => {
  return c.json({
    success: true,
    data: {
      tools: BUILT_IN_TOOLS,
      total: BUILT_IN_TOOLS.length,
    },
  });
});

toolsRouter.get("/:name", (c) => {
  const name = c.req.param("name");

  const tool = toolsByName.get(name);

  if (!tool) {
    return c.json(
      {
        success: false,
        error: {
          code: "TOOL_NOT_FOUND",
          message: `Tool '${name}' not found`,
          available_tools: BUILT_IN_TOOLS.map((t) => t.name),
        },
      },
      404
    );
  }

  return c.json({
    success: true,
    data: tool,
  });
});

toolsRouter.post("/:name/execute", (c) => {
  const name = c.req.param("name");

  const tool = toolsByName.get(name);

  if (!tool) {
    return c.json(
      {
        success: false,
        error: {
          code: "TOOL_NOT_FOUND",
          message: `Tool '${name}' not found`,
          available_tools: BUILT_IN_TOOLS.map((t) => t.name),
        },
      },
      404
    );
  }

  return c.json(
    {
      success: false,
      error: {
        code: "NOT_IMPLEMENTED",
        message: `Tool execution is not yet implemented. Tool '${name}' exists but cannot be executed via the REST API at this time.`,
        tool_name: name,
        status: 501,
      },
    },
    501
  );
});
