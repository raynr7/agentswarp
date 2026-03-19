import type {
  Agent,
  Run,
  RunStep,
  Memory,
  WorkspaceFile,
  AppSettings,
  Personality,
} from './types';

const BASE_URL =
  (import.meta.env.PUBLIC_API_URL as string) ?? 'http://localhost:3001';

const TOKEN_KEY = 'agentswarp-token';

function getToken(): string | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const method = (options.method ?? 'GET').toUpperCase();
  if (method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  let body: unknown;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  if (response.ok) {
    return body as T;
  }

  const errorBody = body as { message?: string; error?: string };
  const message =
    errorBody?.message ??
    errorBody?.error ??
    `Request failed with status ${response.status}`;
  throw new Error(message);
}

export const agents = {
  list(): Promise<Agent[]> {
    return request<Agent[]>('/api/agents');
  },

  get(id: string): Promise<Agent> {
    return request<Agent>(`/api/agents/${id}`);
  },

  create(data: Partial<Agent>): Promise<Agent> {
    return request<Agent>('/api/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: Partial<Agent>): Promise<Agent> {
    return request<Agent>(`/api/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(id: string): Promise<void> {
    return request<void>(`/api/agents/${id}`, {
      method: 'DELETE',
    });
  },

  run(id: string, input?: string): Promise<Run> {
    return request<Run>(`/api/agents/${id}/run`, {
      method: 'POST',
      body: JSON.stringify({ input }),
    });
  },
};

export const runs = {
  list(agentId?: string, limit?: number): Promise<Run[]> {
    const params = new URLSearchParams();
    if (agentId !== undefined) params.set('agent_id', agentId);
    if (limit !== undefined) params.set('limit', String(limit));
    const query = params.toString();
    return request<Run[]>(`/api/runs${query ? `?${query}` : ''}`);
  },

  get(id: string): Promise<Run> {
    return request<Run>(`/api/runs/${id}`);
  },

  getSteps(id: string): Promise<RunStep[]> {
    return request<RunStep[]>(`/api/runs/${id}/steps`);
  },
};

export const memory = {
  list(agentId: string, type?: 'kv' | 'vector'): Promise<Memory[]> {
    const params = new URLSearchParams({ agent_id: agentId });
    if (type !== undefined) params.set('type', type);
    return request<Memory[]>(`/api/memory?${params.toString()}`);
  },

  search(agentId: string, query: string): Promise<Memory[]> {
    const params = new URLSearchParams({ agent_id: agentId, q: query });
    return request<Memory[]>(`/api/memory/search?${params.toString()}`);
  },

  delete(agentId: string, id: string): Promise<void> {
    const params = new URLSearchParams({ agent_id: agentId });
    return request<void>(`/api/memory/${id}?${params.toString()}`, {
      method: 'DELETE',
    });
  },

  listFiles(agentId: string): Promise<WorkspaceFile[]> {
    const params = new URLSearchParams({ agent_id: agentId });
    return request<WorkspaceFile[]>(`/api/memory/files?${params.toString()}`);
  },
};

export const settings = {
  get(): Promise<AppSettings> {
    return request<AppSettings>('/api/settings');
  },

  update(data: Partial<AppSettings>): Promise<AppSettings> {
    return request<AppSettings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getPersonalities(): Promise<Personality[]> {
    return request<Personality[]>('/api/settings/personalities');
  },

  addPersonality(data: Personality): Promise<Personality> {
    return request<Personality>('/api/settings/personalities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  testLLM(): Promise<{ ok: boolean; message: string }> {
    return request<{ ok: boolean; message: string }>('/api/settings/test-llm', {
      method: 'POST',
    });
  },
};

export const auth = {
  async login(
    email: string,
    password: string
  ): Promise<{ token: string }> {
    const result = await request<{ token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, result.token);
    }
    return result;
  },

  magicRequest(email: string): Promise<void> {
    return request<void>('/api/auth/magic/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async magicVerify(
    email: string,
    otp: string
  ): Promise<{ token: string }> {
    const result = await request<{ token: string }>('/api/auth/magic/verify', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, result.token);
    }
    return result;
  },

  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
};

