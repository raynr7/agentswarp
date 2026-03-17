import type { Message, LLMResponse, LLMConfig, ToolDef } from './types';

export interface LLMClient {
  chat(messages: Message[], tools?: ToolDef[]): Promise<LLMResponse>;
  streamChat(messages: Message[], tools?: ToolDef[]): AsyncGenerator<string>;
}

// Extended config to support additional providers
export interface ExtendedLLMConfig extends Omit<LLMConfig, 'provider'> {
  provider: 'openai' | 'groq' | 'anthropic' | 'ollama' | 'gemini' | 'litellm';
}

function parseOpenAIToolCalls(toolCallsRaw: any[]): { name: string; input: unknown }[] | undefined {
  if (!toolCallsRaw || toolCallsRaw.length === 0) return undefined;
  return toolCallsRaw.map((tc: any) => ({
    name: tc.function.name,
    input: (() => {
      try {
        return JSON.parse(tc.function.arguments || '{}');
      } catch {
        return {};
      }
    })(),
  }));
}

async function* streamOpenAICompatible(
  url: string,
  headers: Record<string, string>,
  body: Record<string, unknown>
): AsyncGenerator<string> {
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...body, stream: true }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Stream error (${res.status}): ${err}`);
  }

  if (!res.body) {
    throw new Error('No response body for streaming');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // skip malformed
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export class OpenAIClient implements LLMClient {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private temperature: number;

  constructor(config: ExtendedLLMConfig | LLMConfig) {
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || '';
    this.model = config.model || 'gpt-4o-mini';
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.temperature = config.temperature ?? 0.1;
  }

  private buildBody(messages: Message[], tools?: ToolDef[]): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: this.temperature,
      max_tokens: 4096,
    };

    if (tools && tools.length > 0) {
      body.tools = tools.map(t => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
    }

    return body;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  async chat(messages: Message[], tools?: ToolDef[]): Promise<LLMResponse> {
    const body = this.buildBody(messages, tools);

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${err}`);
    }

    const data = await res.json() as any;
    const choice = data.choices?.[0];
    const content = choice?.message?.content || '';
    const toolCalls = parseOpenAIToolCalls(choice?.message?.tool_calls || []);

    return { content, tool_calls: toolCalls };
  }

  async *streamChat(messages: Message[], tools?: ToolDef[]): AsyncGenerator<string> {
    const body = this.buildBody(messages, tools);
    yield* streamOpenAICompatible(
      `${this.baseUrl}/chat/completions`,
      this.getHeaders(),
      body
    );
  }
}

export class GroqClient implements LLMClient {
  private apiKey: string;
  private model: string;
  private temperature: number;
  private baseUrl = 'https://api.groq.com/openai/v1';

  constructor(config: ExtendedLLMConfig | LLMConfig) {
    this.apiKey = config.apiKey || process.env.GROQ_API_KEY || '';
    this.model = config.model || 'llama-3.1-70b-versatile';
    this.temperature = config.temperature ?? 0.1;
  }

  private buildBody(messages: Message[], tools?: ToolDef[]): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: this.temperature,
      max_tokens: 4096,
    };

    if (tools && tools.length > 0) {
      body.tools = tools.map(t => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
    }

    return body;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  async chat(messages: Message[], tools?: ToolDef[]): Promise<LLMResponse> {
    const body = this.buildBody(messages, tools);

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq API error (${res.status}): ${err}`);
    }

    const data = await res.json() as any;
    const choice = data.choices?.[0];
    const content = choice?.message?.content || '';
    const toolCalls = parseOpenAIToolCalls(choice?.message?.tool_calls || []);

    return { content, tool_calls: toolCalls };
  }

  async *streamChat(messages: Message[], tools?: ToolDef[]): AsyncGenerator<string> {
    const body = this.buildBody(messages, tools);
    yield* streamOpenAICompatible(
      `${this.baseUrl}/chat/completions`,
      this.getHeaders(),
      body
    );
  }
}

export class AnthropicClient implements LLMClient {
  private apiKey: string;
  private model: string;
  private temperature: number;

  constructor(config: ExtendedLLMConfig | LLMConfig) {
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.model = config.model || 'claude-3-5-sonnet-20241022';
    this.temperature = config.temperature ?? 0.1;
  }

  private buildBody(
    messages: Message[],
    tools?: ToolDef[]
  ): { body: Record<string, unknown>; systemMsg?: string } {
    const systemMsg = messages.find(m => m.role === 'system');
    const nonSystemMsgs = messages.filter(m => m.role !== 'system');

    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: 4096,
      temperature: this.temperature,
      messages: nonSystemMsgs.map(m => ({ role: m.role, content: m.content })),
    };

    if (systemMsg) {
      body.system = systemMsg.content;
    }

    if (tools && tools.length > 0) {
      body.tools = tools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      }));
    }

    return { body, systemMsg: systemMsg?.content };
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01',
    };
  }

  async chat(messages: Message[], tools?: ToolDef[]): Promise<LLMResponse> {
    const { body } = this.buildBody(messages, tools);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error (${res.status}): ${err}`);
    }

    const data = await res.json() as any;
    let content = '';
    const toolCalls: { name: string; input: unknown }[] = [];

    for (const block of data.content || []) {
      if (block.type === 'text') content += block.text;
      if (block.type === 'tool_use') {
        toolCalls.push({ name: block.name, input: block.input });
      }
    }

    return { content, tool_calls: toolCalls.length > 0 ? toolCalls : undefined };
  }

  async *streamChat(messages: Message[], tools?: ToolDef[]): AsyncGenerator<string> {
    const { body } = this.buildBody(messages, tools);

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { ...this.getHeaders(), 'anthropic-beta': 'messages-2023-12-15' },
      body: JSON.stringify({ ...body, stream: true }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic stream error (${res.status}): ${err}`);
    }

    if (!res.body) throw new Error('No response body for Anthropic streaming');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
              yield json.delta.text;
            }
          } catch {
            // skip
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

function extractJsonFromText(text: string): { name: string; input: unknown }[] {
  const calls: { name: string; input: unknown }[] = [];

  // Strategy 1: Try direct JSON.parse
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item.tool && typeof item.tool === 'string') {
          calls.push({ name: item.tool, input: item.input ?? item.parameters ?? {} });
        } else if (item.name && typeof item.name === 'string') {
          calls.push({ name: item.name, input: item.input ?? item.parameters ?? {} });
        }
      }
      if (calls.length > 0) return calls;
    } catch {
      // fall through
    }
  }

  // Strategy 2: Extract from markdown fences
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)```/g;
  let fenceMatch;
  while ((fenceMatch = fenceRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(fenceMatch[1].trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item.tool && typeof item.tool === 'string') {
          calls.push({ name: item.tool, input: item.input ?? item.parameters ?? {} });
        } else if (item.name && typeof item.name === 'string') {
          calls.push({ name: item.name, input: item.input ?? item.parameters ?? {} });
        }
      }
    } catch {
      // skip
    }
  }
  if (calls.length > 0) return calls;

  // Strategy 3: Find JSON objects in text using brace matching
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (text[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        const candidate = text.slice(start, i + 1);
        try {
          const parsed = JSON.parse(candidate);
          if (parsed.tool && typeof parsed.tool === 'string') {
            calls.push({ name: parsed.tool, input: parsed.input ?? parsed.parameters ?? {} });
          } else if (parsed.name && typeof parsed.name === 'string' && parsed.input !== undefined) {
            calls.push({ name: parsed.name, input: parsed.input });
          }
        } catch {
          // skip
        }
        start = -1;
      }
    }
  }

  return calls;
}

export class OllamaClient implements LLMClient {
  private baseUrl: string;
  private model: string;
  private temperature: number;

  constructor(config: ExtendedLLMConfig | LLMConfig) {
    this.baseUrl = config.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = config.model || process.env.DEFAULT_MODEL || 'phi3:mini';
    this.temperature = config.temperature ?? 0.1;
  }

  async chat(messages: Message[], _tools?: ToolDef[]): Promise<LLMResponse> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: false,
        options: { temperature: this.temperature, num_predict: 4096 },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Ollama API error (${res.status}): ${err}`);
    }

    const data = await res.json() as any;
    const content = data.message?.content || '';

    const toolCalls = extractJsonFromText(content);

    return { content, tool_calls: toolCalls.length > 0 ? toolCalls : undefined };
  }

  async *streamChat(messages: Message[], _tools?: ToolDef[]): AsyncGenerator<string> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: true,
        options: { temperature: this.temperature, num_predict: 4096 },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Ollama stream error (${res.status}): ${err}`);
    }

    if (!res.body) throw new Error('No response body for Ollama streaming');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const json = JSON.parse(trimmed);
            const delta = json.message?.content;
            if (delta) yield delta;
          } catch {
            // skip
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export class GeminiClient implements LLMClient {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private temperature: number;

  constructor(config: ExtendedLLMConfig | LLMConfig) {
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY || '';
    this.model = config.model || 'gemini-2.0-flash';
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/openai';
    this.temperature = config.temperature ?? 0.1;
  }

  private buildBody(messages: Message[], tools?: ToolDef[]): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: this.temperature,
      max_tokens: 4096,
    };

    if (tools && tools.length > 0) {
      body.tools = tools.map(t => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
    }

    return body;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  async chat(messages: Message[], tools?: ToolDef[]): Promise<LLMResponse> {
    const body = this.buildBody(messages, tools);

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${err}`);
    }

    const data = await res.json() as any;
    const choice = data.choices?.[0];
    const content = choice?.message?.content || '';
    const toolCalls = parseOpenAIToolCalls(choice?.message?.tool_calls || []);

    return { content, tool_calls: toolCalls };
  }

  async *streamChat(messages: Message[], tools?: ToolDef[]): AsyncGenerator<string> {
    const body = this.buildBody(messages, tools);
    yield* streamOpenAICompatible(
      `${this.baseUrl}/chat/completions`,
      this.getHeaders(),
      body
    );
  }
}

export class LiteLLMClient implements LLMClient {
  private apiKey: string;
  private model: string;
  private baseUrl: string;
  private temperature: number;

  constructor(config: ExtendedLLMConfig | LLMConfig) {
    this.apiKey = config.apiKey || process.env.LITELLM_API_KEY || '';
    this.model = config.model || 'gpt-4o-mini';
    this.baseUrl = config.baseUrl || process.env.LITELLM_BASE_URL || 'http://localhost:4000';
    this.temperature = config.temperature ?? 0.1;
  }

  private buildBody(messages: Message[], tools?: ToolDef[]): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: this.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: this.temperature,
      max_tokens: 4096,
    };

    if (tools && tools.length > 0) {
      body.tools = tools.map(t => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
    }

    return body;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
    };
  }

  async chat(messages: Message[], tools?: ToolDef[]): Promise<LLMResponse> {
    const body = this.buildBody(messages, tools);

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`LiteLLM API error (${res.status}): ${err}`);
    }

    const data = await res.json() as any;
    const choice = data.choices?.[0];
    const content = choice?.message?.content || '';
    const toolCalls = parseOpenAIToolCalls(choice?.message?.tool_calls || []);

    return { content, tool_calls: toolCalls };
  }

  async *streamChat(messages: Message[], tools?: ToolDef[]): AsyncGenerator<string> {
    const body = this.buildBody(messages, tools);
    yield* streamOpenAICompatible(
      `${this.baseUrl}/chat/completions`,
      this.getHeaders(),
      body
    );
  }
}

export function createLLMClient(config: LLMConfig | ExtendedLLMConfig): LLMClient {
  const provider = config.provider as string;
  switch (provider) {
    case 'openai':
      return new OpenAIClient(config as ExtendedLLMConfig);
    case 'groq':
      return new GroqClient(config as ExtendedLLMConfig);
    case 'anthropic':
      return new AnthropicClient(config as ExtendedLLMConfig);
    case 'ollama':
      return new OllamaClient(config as ExtendedLLMConfig);
    case 'gemini':
      return new GeminiClient(config as ExtendedLLMConfig);
    case 'litellm':
      return new LiteLLMClient(config as ExtendedLLMConfig);
    default:
      throw new Error(`Unknown LLM provider: ${config.provider}`);
  }
}
