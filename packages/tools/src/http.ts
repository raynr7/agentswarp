import { z } from 'zod';
import type { Tool } from '@agentswarm/core';

export const httpTool: Tool = {
  name: 'http_request',
  description: 'Make HTTP requests to any URL. Supports GET, POST, PUT, DELETE, PATCH. Use for APIs, webhooks, fetching web data.',
  schema: z.object({
    url: z.string().url(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
    headers: z.record(z.string()).optional(),
    body: z.unknown().optional(),
    timeout_ms: z.number().default(30000),
  }),
  async execute(input: any) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.timeout_ms);

    try {
      const options: RequestInit = {
        method: input.method,
        headers: input.headers || {},
        signal: controller.signal,
      };

      if (input.body && ['POST', 'PUT', 'PATCH'].includes(input.method)) {
        options.body = typeof input.body === 'string' ? input.body : JSON.stringify(input.body);
        if (!input.headers?.['Content-Type']) {
          (options.headers as Record<string, string>)['Content-Type'] = 'application/json';
        }
      }

      const res = await fetch(input.url, options);
      const contentType = res.headers.get('content-type') || '';
      let body: unknown;

      if (contentType.includes('application/json')) {
        body = await res.json();
      } else {
        body = await res.text();
      }

      return {
        status: res.status,
        status_text: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        body,
      };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error(`Request timed out after ${input.timeout_ms}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  },
};
