const BASE = '/api';

async function request(url: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  agents: {
    list: () => request('/agents'),
    get: (id: string) => request(`/agents/${id}`),
    create: (data: Record<string, unknown>) => request('/agents', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Record<string, unknown>) => request(`/agents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    run: (id: string, goal?: string) => request(`/agents/${id}/run`, { method: 'POST', body: JSON.stringify({ goal }) }),
    delete: (id: string) => request(`/agents/${id}`, { method: 'DELETE' }),
    runs: (id: string) => request(`/agents/${id}/runs`),
    memory: (id: string) => request(`/agents/${id}/memory`),
  },
  runs: {
    get: (id: string) => request(`/runs/${id}`),
    list: (agentId?: string) => request(`/runs${agentId ? `?agent_id=${agentId}` : ''}`),
    delete: (id: string) => request(`/runs/${id}`, { method: 'DELETE' }),
  },
  tools: {
    list: () => request('/tools'),
    get: (name: string) => request(`/tools/${name}`),
  },
  triggers: {
    list: (agentId?: string) => request(`/triggers${agentId ? `?agent_id=${agentId}` : ''}`),
    create: (data: Record<string, unknown>) => request('/triggers', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/triggers/${id}`, { method: 'DELETE' }),
  },
  health: () => request('/health'),
};
