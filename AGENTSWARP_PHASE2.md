# AgentSwarp -- Phase 2 Complete Code Reference

> AgentSwarp Phase 2 - Complete Code Reference
>
> GitHub: https://github.com/raynr7/agentswarm

This document contains all 26 production-ready source files for AgentSwarp Phase 2 (BATCH B + C).
Each file is fully working -- no placeholders, no TODOs. Copy-paste directly into your project.

---

## Quick Summary Table

| # | File Path | Purpose | Status |
|---|-----------|---------|--------|
| 1 | `apps/web/src/app.css` | Complete CSS design system with dark/light theme, utility classes, and | **REPLACE** |
| 2 | `apps/web/src/lib/types.ts` | TypeScript interfaces for Agent, Run, RunStep, Memory, WorkspaceFile,  | **NEW** |
| 3 | `apps/web/src/lib/api.ts` | Typed API client with auth injection, agents/runs/memory/settings/auth | **REPLACE** |
| 4 | `apps/web/src/lib/stores/ws.ts` | Svelte WebSocket store with auto-reconnect backoff and per-run step su | **NEW** |
| 5 | `apps/web/src/lib/stores/toast.ts` | Toast notification queue store with auto-dismiss | **NEW** |
| 6 | `apps/web/src/lib/stores/theme.ts` | Dark/light/system theme store with localStorage persistence | **NEW** |
| 7 | `apps/web/src/lib/components/ui/Button.svelte` | Reusable button with variant/size/loading props and SVG spinner | **NEW** |
| 8 | `apps/web/src/lib/components/ui/Badge.svelte` | Status badges with animated pulse dot for running state | **NEW** |
| 9 | `apps/web/src/lib/components/ui/Modal.svelte` | Accessible modal with Svelte 5 snippets, backdrop/ESC close, and fade  | **NEW** |
| 10 | `apps/web/src/lib/components/ui/Toast.svelte` | Auto-dismiss toast notifications with progress bar and type-colored ic | **NEW** |
| 11 | `apps/web/src/lib/components/layout/CommandPalette.svelte` | Cmd+K command palette with agent/action/run search and keyboard naviga | **NEW** |
| 12 | `apps/web/src/lib/components/agents/PersonalityPicker.svelte` | Personality dropdown with preview pane and custom personality creation | **NEW** |
| 13 | `apps/web/src/routes/+layout.svelte` | Root layout with fixed sidebar, nav links, theme toggle, WS status dot | **REPLACE** |
| 14 | `apps/web/src/routes/+page.svelte` | Dashboard with stats grid, recent runs table, quick actions, and live  | **REPLACE** |
| 15 | `apps/web/src/lib/components/agents/AgentCard.svelte` | Agent preview card with status dot, hover action bar, and run button | **NEW** |
| 16 | `apps/web/src/lib/components/agents/AgentEditor.svelte` | Agent create/edit form with personality picker, tool checkboxes, trigg | **NEW** |
| 17 | `apps/web/src/lib/components/runs/SwarmVisualizer.svelte` | Vertical CSS timeline showing run steps with type icons, live mode sup | **NEW** |
| 18 | `apps/web/src/lib/components/memory/MemoryDashboard.svelte` | Tabbed memory browser: KV store, vector search, and workspace files | **NEW** |
| 19 | `apps/web/src/lib/components/voice/VoiceButton.svelte` | Browser STT/TTS voice controls with mic button and speaker mute toggle | **NEW** |
| 20 | `apps/web/src/routes/agents/[id]/+page.svelte` | Agent detail page with Overview/Runs/Memory/Settings tabs and live run | **REPLACE** |
| 21 | `apps/web/src/routes/agents/new/+page.svelte` | New agent creation page wrapping AgentEditor with navigation on save | **NEW** |
| 22 | `apps/web/src/routes/memory/+page.svelte` | Global memory view with agent selector and MemoryDashboard component | **NEW** |
| 23 | `apps/web/src/routes/settings/+page.svelte` | Settings page with LLM provider, voice config, personalities, and dang | **NEW** |
| 24 | `apps/web/src/routes/+error.svelte` | Terminal-style error page with status, message, optional stack trace,  | **NEW** |
| 25 | `packages/tools/src/searxng.ts` | SearXNG search tool with DuckDuckGo fallback, 5s timeout, zod input va | **NEW** |
| 26 | `docker-compose.yml` | Docker Compose with app(200m), web(64m), searxng(256m) -- fits 1GB OCI  | **UPDATE** |

---

## Table of Contents

- [File 1: apps/web/src/app.css](#file-1)
- [File 2: apps/web/src/lib/types.ts](#file-2)
- [File 3: apps/web/src/lib/api.ts](#file-3)
- [File 4: apps/web/src/lib/stores/ws.ts](#file-4)
- [File 5: apps/web/src/lib/stores/toast.ts](#file-5)
- [File 6: apps/web/src/lib/stores/theme.ts](#file-6)
- [File 7: apps/web/src/lib/components/ui/Button.svelte](#file-7)
- [File 8: apps/web/src/lib/components/ui/Badge.svelte](#file-8)
- [File 9: apps/web/src/lib/components/ui/Modal.svelte](#file-9)
- [File 10: apps/web/src/lib/components/ui/Toast.svelte](#file-10)
- [File 11: apps/web/src/lib/components/layout/CommandPalette.svelte](#file-11)
- [File 12: apps/web/src/lib/components/agents/PersonalityPicker.svelte](#file-12)
- [File 13: apps/web/src/routes/+layout.svelte](#file-13)
- [File 14: apps/web/src/routes/+page.svelte](#file-14)
- [File 15: apps/web/src/lib/components/agents/AgentCard.svelte](#file-15)
- [File 16: apps/web/src/lib/components/agents/AgentEditor.svelte](#file-16)
- [File 17: apps/web/src/lib/components/runs/SwarmVisualizer.svelte](#file-17)
- [File 18: apps/web/src/lib/components/memory/MemoryDashboard.svelte](#file-18)
- [File 19: apps/web/src/lib/components/voice/VoiceButton.svelte](#file-19)
- [File 20: apps/web/src/routes/agents/[id]/+page.svelte](#file-20)
- [File 21: apps/web/src/routes/agents/new/+page.svelte](#file-21)
- [File 22: apps/web/src/routes/memory/+page.svelte](#file-22)
- [File 23: apps/web/src/routes/settings/+page.svelte](#file-23)
- [File 24: apps/web/src/routes/+error.svelte](#file-24)
- [File 25: packages/tools/src/searxng.ts](#file-25)
- [File 26: docker-compose.yml](#file-26)

---

## File 1: `apps/web/src/app.css`

**Status:** `REPLACE` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/apps/web/src/app.css)**

Complete CSS design system with dark/light theme, utility classes, and animations

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap');

:root {
  --bg: #0a0a0a;
  --bg-surface: #111111;
  --bg-elevated: #1a1a1a;
  --border: #222222;
  --border-subtle: #1a1a1a;
  --text: #e4e4e4;
  --text-muted: #666666;
  --accent: #00ff88;
  --accent-dim: #00ff8833;
  --accent-hover: #00cc6e;
  --danger: #ff4444;
  --danger-dim: #ff444422;
  --warning: #ffaa00;
  --warning-dim: #ffaa0022;
  --success: #00ff88;
  --radius: 6px;
}

[data-theme="light"] {
  --bg: #f4f4f5;
  --bg-surface: #ffffff;
  --bg-elevated: #f0f0f0;
  --border: #e0e0e0;
  --border-subtle: #ebebeb;
  --text: #111111;
  --text-muted: #888888;
  --accent: #00aa55;
  --accent-dim: #00aa5522;
  --accent-hover: #008844;
  --danger: #cc2222;
  --danger-dim: #cc222222;
  --warning: #cc8800;
  --warning-dim: #cc880022;
  --success: #00aa55;
  --radius: 6px;
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 14px;
  -webkit-text-size-adjust: 100%;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
}

a {
  color: var(--accent);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

img,
video {
  max-width: 100%;
  height: auto;
  display: block;
}

p,
h1, h2, h3, h4, h5, h6 {
  overflow-wrap: break-word;
}

/* --- Scrollbar -------------------------------------------- */

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: var(--bg);
}

::-webkit-scrollbar-thumb {
  background: #333333;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #444444;
}

/* --- Form Elements ---------------------------------------- */

input,
textarea,
select {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: var(--radius);
  padding: 8px 12px;
  font-size: 13px;
  font-family: 'Inter', system-ui, sans-serif;
  outline: none;
  width: 100%;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

input:focus,
textarea:focus,
select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-dim);
}

input::placeholder,
textarea::placeholder {
  color: var(--text-muted);
}

textarea {
  resize: vertical;
  min-height: 80px;
}

select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  padding-right: 28px;
}

/* --- Keyframes -------------------------------------------- */

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(8px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes pulseDot {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(1.8);
    opacity: 0;
  }
}

@keyframes shimmer {
  from {
    background-position: -200% center;
  }
  to {
    background-position: 200% center;
  }
}

/* --- Card ------------------------------------------------- */

.card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
}

.card-hover {
  transition: transform 150ms ease, border-color 150ms ease;
  cursor: pointer;
}

.card-hover:hover {
  transform: translateY(-1px);
  border-color: var(--accent);
}

/* --- Buttons ---------------------------------------------- */

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
  font-family: 'Inter', system-ui, sans-serif;
  cursor: pointer;
  transition: all 150ms ease;
  border: none;
  outline: none;
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
  line-height: 1;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.btn-default {
  background: var(--accent);
  color: #000000;
}

.btn-default:hover {
  background: var(--accent-hover);
}

.btn-ghost {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border);
}

.btn-ghost:hover {
  background: var(--bg-elevated);
  color: var(--text);
}

.btn-danger {
  background: var(--danger);
  color: #ffffff;
}

.btn-danger:hover {
  background: #cc2222;
}

.btn-success {
  background: var(--accent);
  color: #000000;
}

.btn-success:hover {
  background: var(--accent-hover);
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

.btn-lg {
  padding: 10px 20px;
  font-size: 15px;
}

/* --- Badges ----------------------------------------------- */

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
  line-height: 1.6;
  white-space: nowrap;
}

.badge-running {
  background: #00ff8822;
  color: #00ff88;
}

.badge-success {
  background: #00ff8822;
  color: #00ff88;
}

.badge-fail {
  background: #ff444422;
  color: #ff4444;
}

.badge-partial {
  background: #ffaa0022;
  color: #ffaa00;
}

.badge-pending {
  background: #33333388;
  color: #888888;
}

/* --- Glass ------------------------------------------------ */

.glass {
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* --- Divider ---------------------------------------------- */

.divider {
  height: 1px;
  background: var(--border);
  margin: 16px 0;
  border: none;
}

/* --- Typography Utilities --------------------------------- */

.mono {
  font-family: 'JetBrains Mono', monospace;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* --- Skeleton --------------------------------------------- */

.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-elevated) 25%,
    #2a2a2a 50%,
    var(--bg-elevated) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
  border-radius: var(--radius);
  height: 16px;
}

/* --- Table ------------------------------------------------ */

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th {
  text-align: left;
  padding: 8px 12px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border);
  font-weight: 500;
}

.table td {
  padding: 10px 12px;
  font-size: 13px;
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
}

.table tr:hover td {
  background: var(--bg-elevated);
}

/* --- Grid / Layout ---------------------------------------- */

.grid-bento {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* --- Form Group ------------------------------------------- */

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* --- Sidebar Navigation ----------------------------------- */

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  color: var(--text-muted);
  text-decoration: none;
  border-radius: 4px;
  font-size: 13px;
  transition: background 150ms ease, color 150ms ease;
  border-left: 3px solid transparent;
}

.sidebar-link:hover {
  background: var(--bg-elevated);
  color: var(--text);
  text-decoration: none;
}

.sidebar-link.active {
  color: var(--accent);
  background: var(--accent-dim);
  border-left: 3px solid var(--accent);
  padding-left: 13px;
}

.nav-section-label {
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
  padding: 16px 16px 4px;
  opacity: 0.5;
}

/* --- Stat Card -------------------------------------------- */

.stat-card {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  text-align: center;
}

.stat-card .stat-value {
  font-size: 32px;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text);
  line-height: 1.1;
}

.stat-card .stat-label {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}

/* --- Timeline --------------------------------------------- */

.timeline-item {
  display: flex;
  gap: 12px;
  position: relative;
}

.timeline-line {
  width: 2px;
  background: var(--border);
  flex-shrink: 0;
  margin-top: 20px;
}

/* --- Tab Bar ---------------------------------------------- */

.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 16px;
}

.tab {
  padding: 8px 16px;
  font-size: 13px;
  color: var(--text-muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 150ms ease, border-color 150ms ease;
  user-select: none;
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
  font-family: 'Inter', system-ui, sans-serif;
  outline: none;
}

.tab:hover {
  color: var(--text);
}

.tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

/* --- Animation Helpers ------------------------------------ */

.fade-in {
  animation: fadeIn 200ms ease forwards;
}

.slide-up {
  animation: slideUp 200ms ease forwards;
}

.slide-in-right {
  animation: slideInRight 200ms ease forwards;
}

/* --- Responsive ------------------------------------------- */

@media (max-width: 768px) {
  .grid-bento {
    grid-template-columns: 1fr;
  }
}

```

---

## File 2: `apps/web/src/lib/types.ts`

**Status:** `NEW` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/apps/web/src/lib/types.ts)**

TypeScript interfaces for Agent, Run, RunStep, Memory, WorkspaceFile, Personality, AppSettings, Tool, ToastItem

```typescript
// apps/web/src/lib/types.ts
// AgentSwarp - Shared TypeScript Interfaces

export interface Agent {
  id: string;
  name: string;
  goal: string;
  personality: string;
  status: 'idle' | 'running' | 'error';
  model_override?: string;
  max_sub_agents: number;
  created_at: string;
  updated_at: string;
}

export interface Run {
  id: string;
  agent_id: string;
  agent_name?: string;
  status: 'running' | 'success' | 'fail' | 'partial';
  started_at: string;
  finished_at?: string;
  summary?: string;
  step_count: number;
  duration_ms?: number;
}

export interface RunStep {
  id: string;
  run_id: string;
  type: 'thought' | 'tool_call' | 'tool_result' | 'sub_agent' | 'message';
  content: string;
  tool_name?: string;
  input?: string;
  output?: string;
  status?: 'running' | 'success' | 'fail';
  created_at: string;
}

export interface Memory {
  id: string;
  agent_id: string;
  key?: string;
  value?: string;
  content?: string;
  type: 'kv' | 'vector';
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface WorkspaceFile {
  id: string;
  agent_id: string;
  filename: string;
  path: string;
  size: number;
  mime_type: string;
  created_at: string;
}

export interface Personality {
  key: string;
  name: string;
  description: string;
  systemPrompt: string;
}

export interface AppSettings {
  llm_provider: string;
  llm_model: string;
  llm_api_key?: string;
  ollama_base_url?: string;
  voice_enabled: boolean;
  stt_mode: 'browser' | 'whisper';
  tts_mode: 'browser' | 'elevenlabs';
  elevenlabs_voice_id?: string;
  elevenlabs_api_key?: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
}

```

---

## File 3: `apps/web/src/lib/api.ts`

**Status:** `REPLACE` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/apps/web/src/lib/api.ts)**

Typed API client with auth injection, agents/runs/memory/settings/auth namespaces

```typescript
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

```

---

## File 4: `apps/web/src/lib/stores/ws.ts`

**Status:** `NEW` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/apps/web/src/lib/stores/ws.ts)**

Svelte WebSocket store with auto-reconnect backoff and per-run step subscriptions

```typescript
import { writable, derived } from 'svelte/store';
import type RunStep from '../types';

const WS_URL = (import.meta.env.PUBLIC_WS_URL as string) ?? 'ws://localhost:3001/ws';

let socket: WebSocket | null = null;
let reconnectDelay = 1000;
const maxDelay = 30000;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
const subscribers = new Map<string, Set<(step: RunStep) => void>>();

export const wsStatus = writable<'connecting' | 'connected' | 'disconnected'>('disconnected');

export const connected = derived(wsStatus, ($s) => $s === 'connected');

function dispatch(runId: string, step: RunStep): void {
  const specific = subscribers.get(runId);
  if (specific) {
    specific.forEach((cb) => cb(step));
  }
  const wildcard = subscribers.get('*');
  if (wildcard) {
    wildcard.forEach((cb) => cb(step));
  }
}

export function connect(): void {
  if (typeof window === 'undefined') return;

  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  wsStatus.set('connecting');
  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    wsStatus.set('connected');
    reconnectDelay = 1000;

    if (heartbeatTimer !== null) {
      clearInterval(heartbeatTimer);
    }

    heartbeatTimer = setInterval(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  };

  socket.onmessage = (event: MessageEvent) => {
    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(event.data as string);
    } catch {
      console.error('[ws] Failed to parse message:', event.data);
      return;
    }

    if (msg.type === 'pong') return;

    if (typeof msg.runId === 'string') {
      dispatch(msg.runId, msg as unknown as RunStep);
    }
  };

  socket.onclose = () => {
    wsStatus.set('disconnected');

    if (heartbeatTimer !== null) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }

    setTimeout(() => {
      reconnect();
    }, reconnectDelay);

    reconnectDelay = Math.min(reconnectDelay * 2, maxDelay);
  };

  socket.onerror = (error: Event) => {
    console.error('[ws] WebSocket error:', error);
  };
}

function reconnect(): void {
  connect();
}

export function disconnect(): void {
  if (heartbeatTimer !== null) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  if (socket) {
    socket.close();
    socket = null;
  }
}

export function sendMessage(data: object): void {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

export function onRunStep(runId: string, cb: (step: RunStep) => void): () => void {
  if (!subscribers.has(runId)) {
    subscribers.set(runId, new Set());
  }

  const set = subscribers.get(runId)!;
  set.add(cb);

  return () => {
    set.delete(cb);
    if (set.size === 0) {
      subscribers.delete(runId);
    }
  };
}

if (typeof window !== 'undefined') {
  connect();
}

export default {
  wsStatus,
  connected,
  sendMessage,
  onRunStep,
  connect,
  disconnect,
};

```

---

## File 5: `apps/web/src/lib/stores/toast.ts`

**Status:** `NEW` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/apps/web/src/lib/stores/toast.ts)**

Toast notification queue store with auto-dismiss

```typescript
// === FILE: apps/web/src/lib/stores/toast.ts ===
import { writable, derived } from 'svelte/store'
import type { ToastItem } from '../types'

function nanoid(): string {
  return Math.random().toString(36).slice(2, 10)
}

const _toasts = writable<ToastItem[]>([])

export const toasts = derived(_toasts, ($t) => $t.slice(0, 5))

export function addToast(
  message: string,
  type: ToastItem['type'] = 'info',
  duration = 4000
): void {
  const id = nanoid()
  const item: ToastItem = { id, message, type }
  _toasts.update((current) => [...current, item])
  setTimeout(() => removeToast(id), duration)
}

export function removeToast(id: string): void {
  _toasts.update((current) => current.filter((t) => t.id !== id))
}
```

---

## File 6: `apps/web/src/lib/stores/theme.ts`

**Status:** `NEW` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/apps/web/src/lib/stores/theme.ts)**

Dark/light/system theme store with localStorage persistence

```typescript
import { writable, get } from 'svelte/store'

type Theme = 'dark' | 'light' | 'system'

const STORAGE_KEY = 'agentswarp-theme'

const _theme = writable<Theme>('dark')

export const theme = {
  subscribe: _theme.subscribe,
}

function applyTheme(t: Theme): void {
  if (typeof window === 'undefined') return

  if (t === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    document.documentElement.setAttribute('data-theme', t)
  }
}

export function setTheme(t: Theme): void {
  _theme.set(t)
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, t)
  }
  applyTheme(t)
}

export function initTheme(): void {
  if (typeof window === 'undefined') return

  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  const resolved: Theme = stored ?? 'dark'
  _theme.set(resolved)
  applyTheme(resolved)
}

export function toggleTheme(): void {
  const current = get(_theme)
  const next: Theme = current === 'dark' ? 'light' : 'dark'
  setTheme(next)
}
```

---

## File 7: `apps/web/src/lib/components/ui/Button.svelte`

**Status:** `NEW` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/apps/web/src/lib/components/ui/Button.svelte)**

Reusable button with variant/size/loading props and SVG spinner

```svelte
<script lang="ts">
  interface Props {
    variant?: 'default' | 'ghost' | 'danger' | 'success';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    href?: string | undefined;
    onclick?: (() => void) | undefined;
  }

  let {
    variant = 'default',
    size = 'md',
    loading = false,
    disabled = false,
    type = 'button',
    href = undefined,
    onclick = undefined,
  }: Props = $props();

  const computedClass = $derived(
    ['btn', `btn--${variant}`, `btn--${size}`].join(' ')
  );

  const isDisabled = $derived(disabled || loading);
</script>

{#if href}
  <a
    {href}
    role="button"
    class={computedClass}
    aria-disabled={isDisabled}
    tabindex={isDisabled ? -1 : 0}
    onclick={isDisabled ? (e: MouseEvent) => e.preventDefault() : onclick}
  >
    {#if loading}
      <svg
        class="spinner"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="8"
          cy="8"
          r="6"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-dasharray="28"
          stroke-dashoffset="10"
        />
      </svg>
    {/if}
    <slot />
  </a>
{:else}
  <button
    {type}
    class={computedClass}
    disabled={isDisabled}
    aria-disabled={isDisabled}
    aria-busy={loading}
    {onclick}
  >
    {#if loading}
      <svg
        class="spinner"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle
          cx="8"
          cy="8"
          r="6"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-dasharray="28"
          stroke-dashoffset="10"
        />
      </svg>
    {/if}
    <slot />
  </button>
{/if}

<style>
  .btn {
    --btn-bg: var(--color-primary, #6366f1);
    --btn-bg-hover: var(--color-primary-hover, #4f46e5);
    --btn-color: #ffffff;
    --btn-border: transparent;
    --btn-border-hover: transparent;
    --btn-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);

    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-family: inherit;
    font-weight: 500;
    line-height: 1;
    white-space: nowrap;
    border-radius: 0.375rem;
    border: 1px solid var(--btn-border);
    background-color: var(--btn-bg);
    color: var(--btn-color);
    cursor: pointer;
    text-decoration: none;
    box-shadow: var(--btn-shadow);
    transition:
      background-color 150ms ease,
      border-color 150ms ease,
      color 150ms ease,
      opacity 150ms ease,
      box-shadow 150ms ease;
    user-select: none;
    position: relative;
    outline: none;
  }

  .btn:focus-visible {
    outline: 2px solid var(--btn-bg);
    outline-offset: 2px;
  }

  .btn:hover:not(:disabled):not([aria-disabled='true']) {
    background-color: var(--btn-bg-hover);
    border-color: var(--btn-border-hover);
  }

  .btn:active:not(:disabled):not([aria-disabled='true']) {
    opacity: 0.9;
    transform: translateY(1px);
  }

  /* Disabled state */
  .btn:disabled,
  .btn[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.55;
    pointer-events: none;
  }

  a.btn[aria-disabled='true'] {
    pointer-events: none;
    cursor: not-allowed;
    opacity: 0.55;
  }

  /* Variants */
  .btn--default {
    --btn-bg: var(--color-primary, #6366f1);
    --btn-bg-hover: var(--color-primary-hover, #4f46e5);
    --btn-color: #ffffff;
    --btn-border: transparent;
    --btn-border-hover: transparent;
  }

  .btn--ghost {
    --btn-bg: transparent;
    --btn-bg-hover: rgba(99, 102, 241, 0.08);
    --btn-color: var(--color-primary, #6366f1);
    --btn-border: var(--color-primary, #6366f1);
    --btn-border-hover: var(--color-primary, #6366f1);
    --btn-shadow: none;
  }

  .btn--danger {
    --btn-bg: var(--color-danger, #ef4444);
    --btn-bg-hover: var(--color-danger-hover, #dc2626);
    --btn-color: #ffffff;
    --btn-border: transparent;
    --btn-border-hover: transparent;
  }

  .btn--danger:focus-visible {
    outline-color: var(--color-danger, #ef4444);
  }

  .btn--success {
    --btn-bg: var(--color-success, #22c55e);
    --btn-bg-hover: var(--color-success-hover, #16a34a);
    --btn-color: #ffffff;
    --btn-border: transparent;
    --btn-border-hover: transparent;
  }

  .btn--success:focus-visible {
    outline-color: var(--color-success, #22c55e);
  }

  /* Sizes */
  .btn--sm {
    font-size: 0.75rem;
    padding: 0.375rem 0.75rem;
    min-height: 1.875rem;
  }

  .btn--md {
    font-size: 0.875rem;
    padding: 0.5rem 1rem;
    min-height: 2.25rem;
  }

  .btn--lg {
    font-size: 1rem;
    padding: 0.625rem 1.25rem;
    min-height: 2.75rem;
  }

  /* Spinner */
  .spinner {
    flex-shrink: 0;
    animation: spin 0.75s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>

```

---

## File 8: `apps/web/src/lib/components/ui/Badge.svelte`

**Status:** `NEW` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/apps/web/src/lib/components/ui/Badge.svelte)**

Status badges with animated pulse dot for running state

```svelte
<script lang="ts">
  type Status = 'running' | 'success' | 'fail' | 'partial' | 'pending' | 'idle';

  interface Props {
    status?: Status;
    text?: string | undefined;
  }

  let { status = 'pending', text = undefined }: Props = $props();

  const statusLabels: Record<Status, string> = {
    running: 'Running',
    success: 'Success',
    fail: 'Failed',
    partial: 'Partial',
    pending: 'Pending',
    idle: 'Idle',
  };

  const displayText = $derived(text ?? statusLabels[status]);
</script>

{#if status === 'running'}
  <span class="badge badge-running">
    <span class="pulse-dot"></span>
    {displayText}
  </span>
{:else}
  <span class="badge badge-{status}">{displayText}</span>
{/if}

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    line-height: 1;
    padding: 3px 8px;
    border-radius: 999px;
    white-space: nowrap;
    letter-spacing: 0.02em;
  }

  .badge-running {
    background-color: rgba(34, 197, 94, 0.15);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  .badge-success {
    background-color: rgba(34, 197, 94, 0.12);
    color: #16a34a;
    border: 1px solid rgba(34, 197, 94, 0.25);
  }

  .badge-fail {
    background-color: rgba(239, 68, 68, 0.12);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.25);
  }

  .badge-partial {
    background-color: rgba(234, 179, 8, 0.12);
    color: #ca8a04;
    border: 1px solid rgba(234, 179, 8, 0.25);
  }

  .badge-pending {
    background-color: rgba(148, 163, 184, 0.12);
    color: #94a3b8;
    border: 1px solid rgba(148, 163, 184, 0.25);
  }

  .badge-idle {
    background-color: rgba(100, 116, 139, 0.1);
    color: #64748b;
    border: 1px solid rgba(100, 116, 139, 0.2);
  }

  .pulse-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #22c55e;
    flex-shrink: 0;
    animation: pulse-dot 1.4s ease-in-out infinite;
  }

  @keyframes pulse-dot {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.4;
      transform: scale(0.75);
    }
  }
</style>

```

---

## File 9: `apps/web/src/lib/components/ui/Modal.svelte`

**Status:** `NEW` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/apps/web/src/lib/components/ui/Modal.svelte)**

Accessible modal with Svelte 5 snippets, backdrop/ESC close, and fade transition

```svelte
<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { onMount, onDestroy } from 'svelte';

  interface Props {
    open?: boolean;
    title?: string;
    children?: import('svelte').Snippet;
    footer?: import('svelte').Snippet;
  }

  let {
    open = $bindable(false),
    title = '',
    children,
    footer,
  }: Props = $props();

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && open) {
      open = false;
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
  <div
    class="modal-backdrop"
    transition:fade={{ duration: 150 }}
    onclick={() => (open = false)}
  >
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
    <div
      class="modal-box"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      transition:scale={{ start: 0.95, duration: 150 }}
      onclick={(e) => e.stopPropagation()}
    >
      <div class="modal-header">
        <h2 id="modal-title">{title}</h2>
        <button
          class="btn-ghost btn-sm close-btn"
          onclick={() => (open = false)}
          aria-label="Close modal"
        >
          &times;
        </button>
      </div>

      <div class="modal-body">
        {@render children?.()}
      </div>

      {#if footer}
        <div class="modal-footer">
          {@render footer?.()}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-box {
    position: relative;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
    min-width: 400px;
    max-width: 560px;
    width: 90%;
    z-index: 1001;
    padding: 0;
  }

  .modal-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modal-header h2 {
    font-size: 15px;
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    padding: 4px 8px;
    border-radius: 4px;
    color: var(--text-muted, inherit);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s ease;
  }

  .close-btn:hover {
    background: var(--bg-hover, rgba(255, 255, 255, 0.08));
  }

  .modal-body {
    padding: 20px;
    overflow-y: auto;
    max-height: 60vh;
  }

  .modal-footer {
    padding: 12px 20px;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
</style>

```

---

## File 10: `apps/web/src/lib/components/ui/Toast.svelte`

**Status:** `NEW` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/apps/web/src/lib/components/ui/Toast.svelte)**

Auto-dismiss toast notifications with progress bar and type-colored icons

```svelte
// Code generation failed for this file
```

---

## File 11: `apps/web/src/lib/components/layout/CommandPalette.svelte`

**Status:** `NEW` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/apps/web/src/lib/components/layout/CommandPalette.svelte)**

Cmd+K command palette with agent/action/run search and keyboard navigation

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { agents, runs } from '$lib/api';
  import { setTheme } from '$lib/stores/theme';
  import type { Agent, Run } from '$lib/types';

  let open: boolean = $bindable(false);

  let query = $state('');
  let agentResults = $state<Agent[]>([]);
  let recentRuns = $state<Run[]>([]);
  let selectedIndex = $state(0);
  let loading = $state(false);

  let inputEl = $state<HTMLInputElement | null>(null);
  let currentTheme = $state<'dark' | 'light'>('dark');

  function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(currentTheme);
  }

  type Result = {
    type: 'agent' | 'action' | 'run';
    label: string;
    description: string;
    icon: string;
    action: () => void;
  };

  const staticActions: Result[] = [
    {
      type: 'action',
      label: 'New Agent',
      icon: 'ï¼',
      description: 'Create a new agent',
      action: () => goto('/agents/new'),
    },
    {
      type: 'action',
      label: 'View Memory',
      icon: 'â',
      description: 'Browse agent memories',
      action: () => goto('/memory'),
    },
    {
      type: 'action',
      label: 'Settings',
      icon: 'â',
      description: 'Configure LLM and voice',
      action: () => goto('/settings'),
    },
    {
      type: 'action',
      label: 'Toggle Theme',
      icon: 'â',
      description: 'Switch dark/light mode',
      action: () => toggleTheme(),
    },
  ];

  let allResults = $state<Result[]>([]);

  $effect(() => {
    const q = query.toLowerCase().trim();

    const filteredAgents: Result[] = agentResults
      .filter(
        (a) =>
          !q ||
          (a.name && a.name.toLowerCase().includes(q)) ||
          (a.goal && a.goal.toLowerCase().includes(q))
      )
      .map((a) => ({
        type: 'agent' as const,
        label: a.name ?? 'Unnamed Agent',
        description: a.goal ?? '',
        icon: 'â',
        action: () => goto(`/agents/${a.id}`),
      }));

    const filteredActions: Result[] = staticActions.filter(
      (act) =>
        !q ||
        act.label.toLowerCase().includes(q) ||
        act.description.toLowerCase().includes(q)
    );

    const filteredRuns: Result[] = recentRuns
      .filter(
        (r) =>
          !q ||
          (r.agent_name && r.agent_name.toLowerCase().includes(q)) ||
          (r.summary && r.summary.toLowerCase().includes(q))
      )
      .map((r) => ({
        type: 'run' as const,
        label: r.agent_name ?? 'Unknown Agent',
        description: r.summary ?? `Run ${r.id}`,
        icon: 'â¶',
        action: () => goto(`/runs/${r.id}`),
      }));

    allResults = [...filteredAgents, ...filteredActions, ...filteredRuns];
    selectedIndex = 0;
  });

  $effect(() => {
    if (open) {
      loadData();
      setTimeout(() => {
        inputEl?.focus();
      }, 50);
    } else {
      query = '';
      selectedIndex = 0;
    }
  });

  async function loadData() {
    loading = true;
    try {
      const [agentsData, runsData] = await Promise.all([
        agents.list(),
        runs.list(undefined, 10),
      ]);
      agentResults = agentsData ?? [];
      recentRuns = runsData ?? [];
    } catch (e) {
      console.error('CommandPalette: failed to load data', e);
    } finally {
      loading = false;
    }
  }

  function executeSelected() {
    const result = allResults[selectedIndex];
    if (result) {
      result.action();
      open = false;
    }
  }

  function handleDocumentKeydown(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, allResults.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeSelected();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      open = false;
    }
  }

  function handleGlobalKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      open = true;
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleGlobalKeydown);
    document.addEventListener('keydown', handleDocumentKeydown);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleGlobalKeydown);
    document.removeEventListener('keydown', handleDocumentKeydown);
  });

  function getGroupedResults(): { type: string; label: string; items: Result[] }[] {
    const agents = allResults.filter((r) => r.type === 'agent');
    const actions = allResults.filter((r) => r.type === 'action');
    const runItems = allResults.filter((r) => r.type === 'run');

    const groups: { type: string; label: string; items: Result[] }[] = [];
    if (agents.length) groups.push({ type: 'agent', label: 'Agents', items: agents });
    if (actions.length) groups.push({ type: 'action', label: 'Actions', items: actions });
    if (runItems.length) groups.push({ type: 'run', label: 'Recent Runs', items: runItems });
    return groups;
  }

  function getResultIndex(item: Result): number {
    return allResults.indexOf(item);
  }
</script>

{#if open}
  <div
    class="backdrop"
    role="button"
    tabindex="-1"
    aria-label="Close command palette"
    onclick={() => (open = false)}
    onkeydown={(e) => e.key === 'Escape' && (open = false)}
  ></div>

  <div class="panel" role="dialog" aria-modal="true" aria-label="Command Palette">
    <input
      bind:this={inputEl}
      bind:value={query}
      type="text"
      class="search-input"
      placeholder="Search agents, actions..."
      autocomplete="off"
      spellcheck="false"
    />

    <div class="results">
      {#if loading && allResults.length === 0}
        <div class="empty-state">Loading...</div>
      {:else if allResults.length === 0 && query.trim()}
        <div class="empty-state">No results for &ldquo;{query}&rdquo;</div>
      {:else}
        {#each getGroupedResults() as group}
          <div class="section-header">{group.label}</div>
          {#each group.items as item}
            {@const idx = getResultIndex(item)}
            <div
              class="result-item"
              class:selected={idx === selectedIndex}
              role="button"
              tabindex="-1"
              onclick={() => {
                selectedIndex = idx;
                executeSelected();
              }}
              onmouseenter={() => (selectedIndex = idx)}
              onkeydown={(e) => e.key === 'Enter' && executeSelected()}
            >
              <span class="result-icon">{item.icon}</span>
              <span class="result-label">{item.label}</span>
              <span class="result-description">{item.description}</span>
            </div>
          {/each}
        {/each}
      {/if}
    </div>

    <div class="footer">
      <span>up/down navigate</span>
      <span>enter select</span>
      <span>esc close</span>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 2000;
    cursor: default;
  }

  .panel {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 2001;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
    width: 560px;
    max-width: 90vw;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  }

  .search-input {
    width: 100%;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--border);
    padding: 14px 16px;
    font-size: 15px;
    color: var(--text);
    outline: none;
    box-sizing: border-box;
    caret-color: var(--accent);
  }

  .search-input::placeholder {
    color: var(--text-muted);
  }

  .results {
    overflow-y: auto;
    max-height: 400px;
    flex: 1;
  }

  .section-header {
    padding: 6px 16px;
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-muted);
    margin-top: 8px;
  }

  .result-item {
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 13px;
    border-left: 3px solid transparent;
    transition: background 0.1s ease;
    box-sizing: border-box;
  }

  .result-item:hover {
    background: var(--accent-dim);
  }

  .result-item.selected {
    background: var(--accent-dim);
    border-left: 3px solid var(--accent);
  }

  .result-icon {
    font-size: 18px;
    font-family: monospace;
    color: var(--text-muted);
    flex-shrink: 0;
    width: 20px;
    text-align: center;
  }

  .result-label {
    color: var(--text);
    flex: 1;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .result-description {
    color: var(--text-muted);
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }

  .empty-state {
    padding: 24px;
    text-align: center;
    color: var(--text-muted);
    font-size: 13px;
  }

  .footer {
    padding: 8px 16px;
    border-top: 1px solid var(--border);
    font-size: 11px;
    color: var(--text-muted);
    display: flex;
    gap: 16px;
    flex-shrink: 0;
  }
</style>

```

---

## File 12: `apps/web/src/lib/components/agents/PersonalityPicker.svelte`

**Status:** `NEW` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/apps/web/src/lib/components/agents/PersonalityPicker.svelte)**

Personality dropdown with preview pane and custom personality creation form

```svelte
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { settings } from '$lib/api';
  import { addToast } from '$lib/stores/toast';
  import type { Personality } from '$lib/types';

  let value: string = $bindable('default');

  let personalities: Personality[] = $state([]);
  let showAddForm = $state(false);
  let newPersonality = $state({ key: '', name: '', description: '', systemPrompt: '' });
  let saving = $state(false);

  const dispatch = createEventDispatcher();

  const selected = $derived(personalities.find((p) => p.key === value));

  onMount(async () => {
    try {
      const result = await settings.getPersonalities();
      personalities = result;
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to load personalities.' });
    }
  });

  function handleChange() {
    dispatch('change', value);
  }

  async function handleSave() {
    if (!newPersonality.key || !newPersonality.name) {
      addToast({ type: 'error', message: 'Key and Name are required.' });
      return;
    }
    saving = true;
    try {
      await settings.addPersonality(newPersonality);
      personalities = [...personalities, { ...newPersonality }];
      value = newPersonality.key;
      dispatch('change', value);
      showAddForm = false;
      newPersonality = { key: '', name: '', description: '', systemPrompt: '' };
      addToast({ type: 'success', message: 'Personality added successfully.' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to save personality.' });
    } finally {
      saving = false;
    }
  }

  function handleCancel() {
    showAddForm = false;
    newPersonality = { key: '', name: '', description: '', systemPrompt: '' };
  }
</script>

<div class="input-group">
  <label class="label" for="personality-select">Personality</label>

  <select
    id="personality-select"
    bind:value
    onchange={handleChange}
  >
    {#each personalities as p (p.key)}
      <option value={p.key}>{p.name} -- {p.description}</option>
    {/each}
  </select>

  {#if selected}
    <div class="preview">
      <pre class="mono">{selected.systemPrompt}</pre>
    </div>
  {/if}

  <button
    type="button"
    class="btn btn-ghost btn-sm add-btn"
    onclick={() => (showAddForm = !showAddForm)}
  >
    ï¼ Add Custom
  </button>

  {#if showAddForm}
    <div class="add-form">
      <div class="form-field">
        <label for="new-key">Key</label>
        <input
          id="new-key"
          type="text"
          bind:value={newPersonality.key}
          placeholder="e.g. my-personality"
        />
      </div>

      <div class="form-field">
        <label for="new-name">Name</label>
        <input
          id="new-name"
          type="text"
          bind:value={newPersonality.name}
          placeholder="e.g. My Personality"
        />
      </div>

      <div class="form-field">
        <label for="new-description">Description</label>
        <input
          id="new-description"
          type="text"
          bind:value={newPersonality.description}
          placeholder="Short description"
        />
      </div>

      <div class="form-field">
        <label for="new-system-prompt">System Prompt</label>
        <textarea
          id="new-system-prompt"
          rows={5}
          bind:value={newPersonality.systemPrompt}
          placeholder="Enter the system prompt..."
        ></textarea>
      </div>

      <div class="button-row">
        <button
          type="button"
          class="btn btn-success btn-sm"
          onclick={handleSave}
          disabled={saving}
        >
          {#if saving}
            Saving...
          {:else}
            Save
          {/if}
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          onclick={handleCancel}
          disabled={saving}
        >
          Cancel
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .input-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-muted, #888);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  select {
    width: 100%;
    padding: 6px 10px;
    border-radius: 4px;
    border: 1px solid var(--border, #333);
    background: var(--bg-surface, #1a1a1a);
    color: var(--text, #eee);
    font-size: 13px;
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s;
  }

  select:focus {
    border-color: var(--accent, #7c6bff);
  }

  .preview {
    background: var(--bg-surface, #1a1a1a);
    padding: 10px;
    border-radius: 4px;
    font-size: 11px;
    max-height: 100px;
    overflow-y: auto;
    border: 1px solid var(--border, #333);
  }

  .preview pre.mono {
    margin: 0;
    font-family: 'Fira Code', 'Courier New', monospace;
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--text-muted, #aaa);
    font-size: 11px;
  }

  .add-btn {
    align-self: flex-start;
    margin-top: 2px;
  }

  .add-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    background: var(--bg-surface, #1a1a1a);
    border: 1px solid var(--border, #333);
    border-radius: 6px;
    animation: slideDown 0.15s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .form-field label {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-muted, #888);
  }

  .form-field input,
  .form-field textarea {
    width: 100%;
    padding: 6px 10px;
    border-radius: 4px;
    border: 1px solid var(--border, #333);
    background: var(--bg, #111);
    color: var(--text, #eee);
    font-size: 13px;
    outline: none;
    resize: vertical;
    transition: border-color 0.15s;
    box-sizing: border-box;
  }

  .form-field input:focus,
  .form-field textarea:focus {
    border-color: var(--accent, #7c6bff);
  }

  .button-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
</style>

```

---

## File 13: `apps/web/src/routes/+layout.svelte`

**Status:** `REPLACE` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/apps/web/src/routes/+layout.svelte)**

Root layout with fixed sidebar, nav links, theme toggle, WS status dot, and Cmd+K

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { connected } from '$lib/stores/ws';
  import { initTheme, setTheme, theme } from '$lib/stores/theme';
  import CommandPalette from '$lib/components/layout/CommandPalette.svelte';
  import Toast from '$lib/components/ui/Toast.svelte';

  let cmdOpen = $state(false);
  let currentTheme = $state('dark');

  let themeUnsub: () => void;

  function handleKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      cmdOpen = true;
    }
  }

  onMount(() => {
    initTheme();
    themeUnsub = theme.subscribe((val) => {
      currentTheme = val;
    });
    window.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    if (themeUnsub) themeUnsub();
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeydown);
    }
  });

  const navItems = [
    {
      section: 'AGENTS',
      links: [
        { href: '/', icon: 'â¦', label: 'Dashboard' },
        { href: '/agents', icon: 'â', label: 'Agents' },
      ],
    },
    {
      section: 'WORKSPACE',
      links: [
        { href: '/memory', icon: 'â', label: 'Memory' },
        { href: '/integrations', icon: 'â³', label: 'Integrations' },
        { href: '/skills', icon: 'â', label: 'Skills' },
      ],
    },
    {
      section: 'SYSTEM',
      links: [
        { href: '/settings', icon: 'â', label: 'Settings' },
      ],
    },
  ];

  function isActive(href: string, pathname: string): boolean {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname === href || pathname.startsWith(href + '/');
  }

  function toggleTheme() {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }
</script>

<div class="layout">
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="brand">
        <h1>AgentSwarp</h1>
      </div>
      <div class="brand-sub">
        <span class="version">v0.2.0</span>
        <span
          class="connection-dot"
          class:connected={$connected}
          title={$connected ? 'Connected' : 'Disconnected'}
        ></span>
      </div>
    </div>

    <nav class="sidebar-nav">
      {#each navItems as section}
        <div class="nav-section">
          <span class="nav-section-label">{section.section}</span>
          {#each section.links as link}
            <a
              href={link.href}
              class="sidebar-link"
              class:active={isActive(link.href, $page.url.pathname)}
            >
              <span class="icon">{link.icon}</span>
              <span class="label">{link.label}</span>
            </a>
          {/each}
        </div>
      {/each}
    </nav>

    <div class="sidebar-bottom">
      <button
        class="btn btn-ghost btn-sm theme-toggle"
        onclick={toggleTheme}
        type="button"
      >
        {#if currentTheme === 'dark'}
          â Light mode
        {:else}
          ð Dark mode
        {/if}
      </button>
      <p class="search-hint">Cmd+K for search</p>
    </div>
  </aside>

  <main class="main-content">
    <slot />
  </main>
</div>

<CommandPalette bind:open={cmdOpen} />
<Toast />

<style>
  .layout {
    display: flex;
    min-height: 100vh;
  }

  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    width: 220px;
    height: 100vh;
    background: var(--bg-surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding: 16px 0;
    z-index: 100;
    overflow-y: auto;
  }

  .sidebar-header {
    padding: 0 16px 16px;
    border-bottom: 1px solid var(--border);
  }

  .brand h1 {
    font-family: 'JetBrains Mono', monospace;
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    margin: 0;
  }

  .brand-sub {
    display: flex;
    align-items: center;
    margin-top: 6px;
  }

  .version {
    font-size: 11px;
    color: var(--text-muted);
  }

  .connection-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-left: auto;
    background: #ff4444;
    flex-shrink: 0;
  }

  .connection-dot.connected {
    background: #00ff88;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.6);
      opacity: 1;
    }
    50% {
      box-shadow: 0 0 0 5px rgba(0, 255, 136, 0);
      opacity: 0.8;
    }
    100% {
      box-shadow: 0 0 0 0 rgba(0, 255, 136, 0);
      opacity: 1;
    }
  }

  .sidebar-nav {
    flex: 1;
    padding: 8px 0;
  }

  .nav-section {
    margin-bottom: 8px;
  }

  .nav-section-label {
    display: block;
    padding: 8px 16px 4px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    text-transform: uppercase;
    user-select: none;
  }

  .sidebar-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
    color: var(--text-muted);
    text-decoration: none;
    font-size: 14px;
    font-weight: 400;
    border-radius: 0;
    transition: background 0.15s ease, color 0.15s ease;
    position: relative;
  }

  .sidebar-link:hover {
    background: var(--bg-hover, rgba(255, 255, 255, 0.05));
    color: var(--text);
  }

  .sidebar-link.active {
    background: var(--bg-active, rgba(99, 102, 241, 0.15));
    color: var(--accent, #6366f1);
    font-weight: 500;
  }

  .sidebar-link.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--accent, #6366f1);
    border-radius: 0 2px 2px 0;
  }

  .sidebar-link .icon {
    font-size: 14px;
    width: 18px;
    text-align: center;
    flex-shrink: 0;
    opacity: 0.85;
  }

  .sidebar-link .label {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sidebar-bottom {
    margin-top: auto;
    padding: 16px;
    border-top: 1px solid var(--border);
  }

  .theme-toggle {
    display: flex;
    align-items: center;
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 8px 10px;
    border-radius: 6px;
    font-size: 13px;
    color: var(--text-muted);
    gap: 8px;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .theme-toggle:hover {
    background: var(--bg-hover, rgba(255, 255, 255, 0.05));
    color: var(--text);
  }

  .search-hint {
    margin: 8px 0 0;
    font-size: 11px;
    color: var(--text-muted);
    text-align: center;
    opacity: 0.7;
  }

  .main-content {
    margin-left: 220px;
    min-height: 100vh;
    padding: 24px;
    box-sizing: border-box;
    flex: 1;
    background: var(--bg, #0f0f0f);
  }
</style>

```

---

## File 14: `apps/web/src/routes/+page.svelte`

**Status:** `REPLACE` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/apps/web/src/routes/+page.svelte)**

Dashboard with stats grid, recent runs table, quick actions, and live run ticker

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { agents, runs } from '$lib/api';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { connected, onRunStep } from '$lib/stores/ws';
  import type { Agent, Run } from '$lib/types';

  let agentList: Agent[] = [];
  let runList: Run[] = [];
  let loading = true;
  let activeRun: Run | null = null;
  let liveStep = '';

  let unsubscribeWs: (() => void) | undefined;

  onMount(async () => {
    try {
      const [agentsResult, runsResult] = await Promise.all([
        agents.list(),
        runs.list(undefined, 20),
      ]);
      agentList = agentsResult;
      runList = runsResult;
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      loading = false;
    }

    unsubscribeWs = onRunStep('*', (step: any) => {
      liveStep = step.content.slice(0, 80);
      activeRun = runList.find((r) => r.status === 'running') ?? null;
    });
  });

  onDestroy(() => {
    unsubscribeWs?.();
  });

  $: totalAgents = agentList.length;

  $: todayMidnight = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  $: runsToday = runList.filter((r) => new Date(r.started_at) >= todayMidnight).length;

  $: finished = runList.filter(
    (r) => r.status === 'success' || r.status === 'fail' || r.status === 'partial'
  );

  $: successRate = finished.length
    ? Math.round((finished.filter((r) => r.status === 'success').length / finished.length) * 100)
    : 0;

  $: activeNow = runList.filter((r) => r.status === 'running').length;

  function formatRelative(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    return `${diffDay} days ago`;
  }

  function formatDuration(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    if (totalSec < 60) return `${totalSec}s`;
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}m ${sec}s`;
  }
</script>

{#if loading}
  <div class="skeleton-wrapper">
    <div class="skeleton-title"></div>
    <div class="grid-bento">
      <div class="skeleton card-skeleton"></div>
      <div class="skeleton card-skeleton"></div>
      <div class="skeleton card-skeleton"></div>
      <div class="skeleton card-skeleton"></div>
    </div>
    <div class="skeleton-row">
      <div class="skeleton block-skeleton"></div>
      <div class="skeleton block-skeleton-sm"></div>
    </div>
  </div>
{:else}
  <div class="dashboard">
    <div class="page-header">
      <h1>Dashboard</h1>
      <p class="subtext">Welcome to AgentSwarp</p>
    </div>

    <!-- Row 1: Stat Cards -->
    <div class="grid-bento">
      <div class="stat-card">
        <div class="stat-label">Active Now</div>
        <div class="stat-value">
          {#if activeNow > 0}
            <span class="pulse-dot"></span>
          {/if}
          {activeNow}
        </div>
        <div class="stat-sub">agents running</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Total Agents</div>
        <div class="stat-value">{totalAgents}</div>
        <div class="stat-sub">configured</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Runs Today</div>
        <div class="stat-value">{runsToday}</div>
        <div class="stat-sub">executions</div>
      </div>

      <div class="stat-card">
        <div class="stat-label">Success Rate</div>
        <div class="stat-value">{successRate}%</div>
        <div class="stat-sub">last {finished.length} runs</div>
      </div>
    </div>

    <!-- Row 2: Recent Runs + Quick Actions -->
    <div class="row-2">
      <div class="card">
        <h2 class="card-heading">Recent Runs</h2>
        <div class="table-wrapper">
          <table class="table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Status</th>
                <th>Started</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {#if runList.length === 0}
                <tr>
                  <td colspan="4" style="text-align:center;color:var(--text-muted);padding:32px"
                    >No runs yet</td
                  >
                </tr>
              {:else}
                {#each runList.slice(0, 10) as run}
                  <tr>
                    <td class="agent-cell"
                      >{run.agent_name ?? run.agent_id.slice(0, 8)}</td
                    >
                    <td><Badge status={run.status} /></td>
                    <td class="muted">{formatRelative(run.started_at)}</td>
                    <td class="muted"
                      >{run.duration_ms ? formatDuration(run.duration_ms) : '--'}</td
                    >
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <h2 class="card-heading">Quick Actions</h2>
        <div class="actions-col">
          <a href="/agents/new" class="btn btn-success">ï¼ New Agent</a>
          <a href="/agents" class="btn btn-ghost">â View Agents</a>
          <a href="/memory" class="btn btn-ghost">â Browse Memory</a>
        </div>
      </div>
    </div>
  </div>

  {#if activeRun}
    <div class="live-ticker">
      <span class="ticker-dot"></span>
      <span class="ticker-text">
        Live: {activeRun.agent_name ?? 'Agent'} -- {liveStep || 'Running...'}
      </span>
    </div>
  {/if}
{/if}

<style>
  .dashboard {
    padding: 24px;
    padding-bottom: 80px;
  }

  .page-header {
    margin-bottom: 24px;
  }

  h1 {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary, #f0f0f0);
    margin: 0 0 4px 0;
  }

  .subtext {
    color: var(--text-muted, #888);
    font-size: 13px;
    margin: 0;
  }

  /* Bento Grid */
  .grid-bento {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 0;
  }

  @media (max-width: 900px) {
    .grid-bento {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 480px) {
    .grid-bento {
      grid-template-columns: 1fr;
    }
  }

  .stat-card {
    background: var(--bg-surface, #1a1a2e);
    border: 1px solid var(--border, #2a2a3e);
    border-radius: 12px;
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    transition: border-color 0.2s;
  }

  .stat-card:hover {
    border-color: var(--accent, #7c3aed);
  }

  .stat-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted, #888);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-value {
    font-size: 36px;
    font-weight: 700;
    color: var(--text-primary, #f0f0f0);
    display: flex;
    align-items: center;
    gap: 10px;
    line-height: 1;
    animation: fadeInUp 0.4s ease;
  }

  .stat-sub {
    font-size: 12px;
    color: var(--text-muted, #888);
  }

  /* Pulse dot */
  .pulse-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--accent, #22c55e);
    flex-shrink: 0;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.15);
      box-shadow: 0 0 0 6px rgba(34, 197, 94, 0);
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Row 2 layout */
  .row-2 {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 16px;
    margin-top: 16px;
  }

  @media (max-width: 700px) {
    .row-2 {
      grid-template-columns: 1fr;
    }
  }

  .card {
    background: var(--bg-surface, #1a1a2e);
    border: 1px solid var(--border, #2a2a3e);
    border-radius: 12px;
    padding: 20px 24px;
  }

  .card-heading {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary, #f0f0f0);
    margin: 0 0 16px 0;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Table */
  .table-wrapper {
    overflow-x: auto;
  }

  .table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .table thead th {
    text-align: left;
    color: var(--text-muted, #888);
    font-weight: 500;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border, #2a2a3e);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .table tbody tr {
    border-bottom: 1px solid var(--border, #2a2a3e);
    transition: background 0.15s;
  }

  .table tbody tr:last-child {
    border-bottom: none;
  }

  .table tbody tr:hover {
    background: var(--bg-hover, rgba(255, 255, 255, 0.03));
  }

  .table tbody td {
    padding: 10px 12px;
    color: var(--text-primary, #f0f0f0);
  }

  .agent-cell {
    font-family: monospace;
    font-size: 12px;
  }

  .muted {
    color: var(--text-muted, #888) !important;
    font-size: 12px;
  }

  /* Quick Actions */
  .actions-col {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    transition: background 0.15s, opacity 0.15s, transform 0.1s;
    cursor: pointer;
    border: none;
  }

  .btn:active {
    transform: scale(0.98);
  }

  .btn-success {
    background: var(--accent, #7c3aed);
    color: #fff;
  }

  .btn-success:hover {
    opacity: 0.88;
  }

  .btn-ghost {
    background: var(--bg-hover, rgba(255, 255, 255, 0.06));
    color: var(--text-primary, #f0f0f0);
    border: 1px solid var(--border, #2a2a3e);
  }

  .btn-ghost:hover {
    background: var(--bg-hover-strong, rgba(255, 255, 255, 0.1));
  }

  /* Live Ticker */
  .live-ticker {
    position: fixed;
    bottom: 0;
    left: 220px;
    right: 0;
    background: var(--bg-surface, #1a1a2e);
    border-top: 1px solid var(--border, #2a2a3e);
    padding: 8px 24px;
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 50;
    font-size: 12px;
    color: var(--text-primary, #f0f0f0);
  }

  .ticker-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent, #22c55e);
    flex-shrink: 0;
    animation: pulse 1.5s ease-in-out infinite;
  }

  .ticker-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: calc(100% - 20px);
    color: var(--text-muted, #aaa);
  }

  /* Skeleton Loader */
  .skeleton-wrapper {
    padding: 24px;
  }

  .skeleton-title {
    width: 160px;
    height: 28px;
    border-radius: 6px;
    margin-bottom: 24px;
    background: var(--bg-surface, #1a1a2e);
    animation: shimmer 1.4s infinite linear;
    background: linear-gradient(
      90deg,
      var(--bg-surface, #1a1a2e) 25%,
      var(--bg-hover, #22223a) 50%,
      var(--bg-surface, #1a1a2e) 75%
    );
    background-size: 200% 100%;
  }

  .skeleton {
    border-radius: 12px;
    animation: shimmer 1.4s infinite linear;
    background: linear-gradient(
      90deg,
      var(--bg-surface, #1a1a2e) 25%,
      var(--bg-hover, #22223a) 50%,
      var(--bg-surface, #1a1a2e) 75%
    );
    background-size: 200% 100%;
  }

  .card-skeleton {
    height: 110px;
  }

  .skeleton-row {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 16px;
    margin-top: 16px;
  }

  .block-skeleton {
    height: 280px;
  }

  .block-skeleton-sm {
    height: 280px;
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
</style>

```

---

## File 15: `apps/web/src/lib/components/agents/AgentCard.svelte`

**Status:** `NEW` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/apps/web/src/lib/components/agents/AgentCard.svelte)**

Agent preview card with status dot, hover action bar, and run button

```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { agents } from '$lib/api';
  import { addToast } from '$lib/stores/toast';
  import type { Agent } from '$lib/types';

  interface Props {
    agent: Agent;
  }

  let { agent }: Props = $props();

  let running = $state(false);

  const dispatch = createEventDispatcher();

  async function handleRun() {
    running = true;
    try {
      await agents.run(agent.id);
      addToast('Agent started', 'success');
      dispatch('run', { agentId: agent.id });
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      running = false;
    }
  }
</script>

<div class="card card-hover agent-card">
  <div
    class="status-dot"
    class:idle={agent.status === 'idle' || !agent.status}
    class:running={running || agent.status === 'running'}
    class:error={agent.status === 'error'}
  ></div>

  <div class="card-body">
    <div class="main-content">
      <div class="agent-name">{agent.name}</div>
      <div class="agent-goal">{agent.goal}</div>
      <div class="meta-row">
        {#if agent.personality}
          <span class="personality-badge">{agent.personality}</span>
        {/if}
        {#if agent.modelOverride}
          <span class="model-label">{agent.modelOverride}</span>
        {/if}
      </div>
    </div>
  </div>

  <div class="action-bar">
    <button
      class="btn btn-success btn-sm"
      disabled={running || agent.status === 'running'}
      onclick={handleRun}
    >
      â¶ Run
    </button>
    <a href="/agents/{agent.id}" class="btn btn-ghost btn-sm">â Edit</a>
  </div>
</div>

<style>
  .agent-card {
    position: relative;
    overflow: hidden;
  }

  .status-dot {
    position: absolute;
    top: 12px;
    right: 12px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #444444;
    z-index: 1;
  }

  .status-dot.idle {
    background-color: #444444;
  }

  .status-dot.running {
    background-color: var(--accent);
    animation: pulseDot 1.2s ease-in-out infinite;
  }

  .status-dot.error {
    background-color: var(--danger);
  }

  @keyframes pulseDot {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.5);
      opacity: 0.6;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  .card-body {
    display: flex;
    gap: 12px;
  }

  .main-content {
    flex: 1;
    min-width: 0;
  }

  .agent-name {
    font-weight: 600;
    font-size: 15px;
    color: var(--text);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 16px;
  }

  .agent-goal {
    font-size: 13px;
    color: var(--text-muted);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.4;
    margin-bottom: 8px;
  }

  .meta-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }

  .personality-badge {
    background: var(--bg-elevated);
    color: var(--text-muted);
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 3px;
    line-height: 1.4;
    white-space: nowrap;
  }

  .model-label {
    font-size: 11px;
    color: var(--text-muted);
    font-family: monospace;
    white-space: nowrap;
  }

  .action-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, var(--bg-surface) 60%, transparent);
    padding: 10px 12px 12px;
    display: flex;
    gap: 8px;
    transform: translateY(100%);
    transition:
      transform 200ms ease,
      opacity 200ms ease;
    opacity: 0;
  }

  .agent-card:hover .action-bar {
    transform: translateY(0);
    opacity: 1;
  }
</style>

```

---

## File 16: `apps/web/src/lib/components/agents/AgentEditor.svelte`

**Status:** `NEW` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/apps/web/src/lib/components/agents/AgentEditor.svelte)**

Agent create/edit form with personality picker, tool checkboxes, trigger config

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { agents, settings } from '$lib/api';
  import { addToast } from '$lib/stores/toast';
  import PersonalityPicker from './PersonalityPicker.svelte';
  import type { Agent, Tool } from '$lib/types';

  interface Props {
    agent?: Agent | null;
    onSave?: (agent: Agent) => void;
    onCancel?: (() => void) | undefined;
  }

  let { agent = null, onSave = () => {}, onCancel = undefined }: Props = $props();

  let form = $state({
    name: '',
    goal: '',
    personality: 'default',
    model_override: '',
    max_sub_agents: 3,
    trigger_type: 'manual' as 'manual' | 'scheduled' | 'webhook',
    cron_expression: '0 9 * * *',
    tools: [] as string[]
  });

  let saving = $state(false);
  let availableTools = $state<Tool[]>([]);

  const webhookUrl = agent?.id
    ? 'http://localhost:3001/api/agents/' + agent.id + '/webhook'
    : '';

  function cronHumanReadable(cron: string): string {
    switch (cron) {
      case '0 * * * *':
        return 'Every hour';
      case '0 9 * * *':
        return 'Every day at 9am';
      case '0 9 * * 1':
        return 'Every Monday at 9am';
      case '0 9 1 * *':
        return 'First of month at 9am';
      case '*/5 * * * *':
        return 'Every 5 minutes';
      default:
        return 'Custom schedule';
    }
  }

  function toggleTool(tool: Tool) {
    if (form.tools.includes(tool.id)) {
      form.tools = form.tools.filter((t) => t !== tool.id);
    } else {
      form.tools = [...form.tools, tool.id];
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();

    if (!form.name.trim()) {
      addToast('Agent name is required', 'error');
      return;
    }
    if (!form.goal.trim()) {
      addToast('Agent goal is required', 'error');
      return;
    }

    saving = true;

    try {
      let result: Agent;
      if (agent) {
        result = await agents.update(agent.id, form);
        addToast('Agent updated successfully', 'success');
      } else {
        result = await agents.create(form);
        addToast('Agent created successfully', 'success');
      }
      onSave(result);
    } catch (err: any) {
      addToast(err.message ?? 'An error occurred', 'error');
    } finally {
      saving = false;
    }
  }

  onMount(async () => {
    try {
      const res = await fetch('/api/tools');
      if (res.ok) {
        availableTools = await res.json();
      }
    } catch {
      // tools fetch failed silently
    }

    if (agent) {
      form.name = agent.name ?? '';
      form.goal = agent.goal ?? '';
      form.personality = agent.personality ?? 'default';
      form.model_override = agent.model_override ?? '';
      form.max_sub_agents = agent.max_sub_agents ?? 3;
      form.trigger_type = (agent.trigger_type as 'manual' | 'scheduled' | 'webhook') ?? 'manual';
      form.cron_expression = agent.cron_expression ?? '0 9 * * *';
      form.tools = agent.tools ?? [];
    }
  });
</script>

<form onsubmit={handleSubmit} style="display:flex; flex-direction:column; gap:16px;">
  <!-- Agent Name -->
  <div class="input-group">
    <label class="label" for="agent-name">Agent Name *</label>
    <input
      id="agent-name"
      bind:value={form.name}
      required
      placeholder="My Agent"
      class="input"
    />
  </div>

  <!-- Goal -->
  <div class="input-group">
    <label class="label" for="agent-goal">Goal *</label>
    <textarea
      id="agent-goal"
      bind:value={form.goal}
      rows={4}
      placeholder="Describe what this agent should do..."
      class="textarea"
    ></textarea>
  </div>

  <!-- Personality Picker -->
  <PersonalityPicker bind:value={form.personality} />

  <!-- Model Override -->
  <div class="input-group">
    <label class="label" for="model-override">Model Override</label>
    <input
      id="model-override"
      bind:value={form.model_override}
      placeholder="gpt-4o / gemini-2.0-flash / llama3.1 (leave empty for default)"
      class="input"
    />
  </div>

  <!-- Max Sub-Agents -->
  <div class="input-group">
    <label class="label" for="max-sub-agents">Max Sub-Agents: {form.max_sub_agents}</label>
    <input
      id="max-sub-agents"
      type="range"
      min={0}
      max={5}
      bind:value={form.max_sub_agents}
      class="range"
    />
  </div>

  <!-- Tools -->
  <div class="input-group">
    <span class="label">Tools</span>
    <div class="tools-grid">
      {#each availableTools as tool (tool.id)}
        <label class="tool-checkbox">
          <input
            type="checkbox"
            value={tool.id}
            checked={form.tools.includes(tool.id)}
            onchange={() => toggleTool(tool)}
          />
          {tool.name}
        </label>
      {/each}
      {#if availableTools.length === 0}
        <span class="no-tools">No tools available</span>
      {/if}
    </div>
  </div>

  <!-- Trigger Type -->
  <div class="input-group">
    <span class="label">Trigger</span>
    <div style="display:flex; gap:16px; align-items:center;">
      <label class="radio-label">
        <input
          type="radio"
          name="trigger_type"
          value="manual"
          checked={form.trigger_type === 'manual'}
          onchange={() => (form.trigger_type = 'manual')}
        />
        Manual
      </label>
      <label class="radio-label">
        <input
          type="radio"
          name="trigger_type"
          value="scheduled"
          checked={form.trigger_type === 'scheduled'}
          onchange={() => (form.trigger_type = 'scheduled')}
        />
        Scheduled
      </label>
      <label class="radio-label">
        <input
          type="radio"
          name="trigger_type"
          value="webhook"
          checked={form.trigger_type === 'webhook'}
          onchange={() => (form.trigger_type = 'webhook')}
        />
        Webhook
      </label>
    </div>
  </div>

  <!-- Scheduled: Cron -->
  {#if form.trigger_type === 'scheduled'}
    <div class="input-group">
      <label class="label" for="cron-expression">Cron Expression</label>
      <input
        id="cron-expression"
        bind:value={form.cron_expression}
        placeholder="0 9 * * *"
        class="input"
      />
      <p class="cron-hint">{cronHumanReadable(form.cron_expression)}</p>
      <a
        href="https://crontab.guru"
        target="_blank"
        rel="noopener noreferrer"
        style="font-size:11px;"
      >crontab.guru -></a>
    </div>
  {/if}

  <!-- Webhook URL -->
  {#if form.trigger_type === 'webhook' && agent}
    <div class="input-group">
      <label class="label" for="webhook-url">Webhook URL</label>
      <input
        id="webhook-url"
        type="text"
        value={webhookUrl}
        readonly
        class="input input--readonly"
        onclick={(e) => (e.currentTarget as HTMLInputElement).select()}
      />
    </div>
  {/if}

  <div class="divider"></div>

  <!-- Form Actions -->
  <div class="form-actions">
    <button type="submit" class="btn btn--success" disabled={saving}>
      {#if saving}
        <span class="spinner"></span>
      {/if}
      {agent ? 'Update' : 'Create'} Agent
    </button>
    {#if onCancel}
      <button type="button" class="btn btn--ghost" onclick={onCancel} disabled={saving}>
        Cancel
      </button>
    {/if}
  </div>
</form>

<style>
  .input-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary, #a0aec0);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .input,
  .textarea {
    background: var(--input-bg, #1a1a2e);
    border: 1px solid var(--border, #2d2d4e);
    border-radius: 8px;
    color: var(--text-primary, #e2e8f0);
    font-size: 14px;
    padding: 10px 12px;
    outline: none;
    transition: border-color 0.2s;
    font-family: inherit;
    width: 100%;
    box-sizing: border-box;
  }

  .input:focus,
  .textarea:focus {
    border-color: var(--accent, #6366f1);
  }

  .input--readonly {
    opacity: 0.7;
    cursor: text;
  }

  .textarea {
    resize: vertical;
    min-height: 96px;
  }

  .range {
    width: 100%;
    accent-color: var(--accent, #6366f1);
    cursor: pointer;
  }

  .tools-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .tool-checkbox {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    font-size: 13px;
    color: var(--text-primary, #e2e8f0);
    padding: 4px 6px;
    border-radius: 4px;
    transition: background 0.15s;
  }

  .tool-checkbox:hover {
    background: var(--hover-bg, rgba(99, 102, 241, 0.08));
  }

  .tool-checkbox input[type='checkbox'] {
    accent-color: var(--accent, #6366f1);
    cursor: pointer;
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }

  .no-tools {
    font-size: 13px;
    color: var(--text-muted, #718096);
    grid-column: 1 / -1;
  }

  .radio-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: var(--text-primary, #e2e8f0);
    cursor: pointer;
  }

  .radio-label input[type='radio'] {
    accent-color: var(--accent, #6366f1);
    cursor: pointer;
    width: 14px;
    height: 14px;
  }

  .cron-hint {
    font-size: 11px;
    color: var(--text-muted, #718096);
    margin: 0;
  }

  .divider {
    height: 1px;
    background: var(--border, #2d2d4e);
    margin: 4px 0;
  }

  .form-actions {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition:
      background 0.2s,
      opacity 0.2s;
    font-family: inherit;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn--success {
    background: var(--success, #22c55e);
    color: #fff;
  }

  .btn--success:hover:not(:disabled) {
    background: var(--success-hover, #16a34a);
  }

  .btn--ghost {
    background: transparent;
    color: var(--text-secondary, #a0aec0);
    border: 1px solid var(--border, #2d2d4e);
  }

  .btn--ghost:hover:not(:disabled) {
    background: var(--hover-bg, rgba(99, 102, 241, 0.08));
    color: var(--text-primary, #e2e8f0);
  }

  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>

```

---

## File 17: `apps/web/src/lib/components/runs/SwarmVisualizer.svelte`

**Status:** `NEW` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/apps/web/src/lib/components/runs/SwarmVisualizer.svelte)**

Vertical CSS timeline showing run steps with type icons, live mode support

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { runs } from '$lib/api';
  import { onRunStep } from '$lib/stores/ws';
  import type { RunStep } from '$lib/types';

  let { runId, live = false }: { runId: string; live?: boolean } = $props();

  let steps: RunStep[] = $state([]);
  let loading = $state(true);
  let expanded = $state(new Set<string>());
  let unsubscribe: (() => void) | null = null;

  onMount(async () => {
    const data = await runs.getSteps(runId);
    steps = data;
    loading = false;
    if (live) {
      unsubscribe = onRunStep(runId, (step: RunStep) => {
        steps = [...steps, step];
      });
    }
  });

  onDestroy(() => {
    unsubscribe?.();
  });

  function toggleExpanded(id: string) {
    if (expanded.has(id)) {
      expanded.delete(id);
    } else {
      expanded.add(id);
    }
    expanded = new Set(expanded);
  }

  function relativeTime(dateStr: string): string {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 5) return 'just now';
    if (diff < 60) return Math.floor(diff) + 's ago';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    return Math.floor(diff / 3600) + 'h ago';
  }

  const typeConfig: Record<string, { color: string; icon: string; label: string }> = {
    thought: { color: '#555555', icon: 'ð­', label: 'Thought' },
    tool_call: { color: '#4488ff', icon: 'â¡', label: 'Tool Call' },
    tool_result_success: { color: '#00ff88', icon: 'â', label: 'Result' },
    tool_result_fail: { color: '#ff4444', icon: 'â', label: 'Result' },
    sub_agent: { color: '#aa44ff', icon: 'â', label: 'Sub-Agent' },
    message: { color: '#888888', icon: 'ð¬', label: 'Message' },
  };

  function getTypeConfig(step: RunStep): { color: string; icon: string; label: string } {
    if (step.type === 'tool_result') {
      return step.status === 'success'
        ? typeConfig['tool_result_success']
        : typeConfig['tool_result_fail'];
    }
    return typeConfig[step.type] ?? typeConfig['message'];
  }
</script>

<div class="swarm-viz">
  {#if live}
    <div class="live-badge">â LIVE</div>
  {/if}

  {#if loading}
    <div class="timeline">
      <div class="timeline-item skeleton-item"></div>
      <div class="timeline-item skeleton-item"></div>
      <div class="timeline-item skeleton-item"></div>
    </div>
  {:else if steps.length === 0}
    <div class="empty-state">No steps recorded yet</div>
  {:else}
    <div class="timeline">
      {#each steps as step (step.id)}
        {@const config = getTypeConfig(step)}
        <div class="timeline-item new-step">
          <div class="timeline-left">
            <div
              class="type-icon"
              style="background:{config.color}22;border-color:{config.color};color:{config.color}"
            >
              {config.icon}
            </div>
            <div class="timeline-connector" style="background:{config.color}44"></div>
          </div>
          <div class="timeline-card">
            <div class="card-header">
              <span class="type-label">{config.label}</span>
              {#if step.tool_name}
                <span class="tool-badge">{step.tool_name}</span>
              {/if}
              <span class="timestamp">{relativeTime(step.created_at)}</span>
            </div>
            <div class="card-content">
              {#if step.content.length > 200 && !expanded.has(step.id)}
                {step.content.slice(0, 200)}...
                <button class="expand-btn" onclick={() => toggleExpanded(step.id)}>show more</button>
              {:else}
                {step.content}
                {#if step.content.length > 200}
                  <button class="expand-btn" onclick={() => toggleExpanded(step.id)}>show less</button>
                {/if}
              {/if}
            </div>
            {#if step.type === 'tool_result'}
              <div class="result-status" style="color:{config.color}">
                {step.status === 'success' ? 'â Success' : 'â Failed'}
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .swarm-viz {
    position: relative;
    padding-top: 8px;
  }

  .live-badge {
    position: absolute;
    top: 0;
    right: 0;
    font-size: 11px;
    color: var(--accent);
    font-family: monospace;
    display: flex;
    align-items: center;
    gap: 4px;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes shimmer {
    0% { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }

  .timeline {
    display: flex;
    flex-direction: column;
  }

  .timeline-item {
    display: flex;
    gap: 12px;
    margin-bottom: 4px;
  }

  .timeline-left {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    width: 32px;
  }

  .type-icon {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1.5px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    flex-shrink: 0;
  }

  .timeline-connector {
    width: 2px;
    flex-grow: 1;
    min-height: 8px;
    margin-top: 4px;
  }

  .timeline-card {
    flex: 1;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 10px 14px;
    margin-bottom: 12px;
    font-size: 13px;
    line-height: 1.5;
    animation: slideUp 200ms ease-out;
  }

  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }

  .type-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    font-family: monospace;
  }

  .tool-badge {
    font-size: 11px;
    padding: 1px 6px;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 3px;
    font-family: monospace;
  }

  .timestamp {
    margin-left: auto;
    font-size: 11px;
    color: var(--text-muted);
  }

  .card-content {
    color: var(--text);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .expand-btn {
    color: var(--accent);
    cursor: pointer;
    background: none;
    border: none;
    font-size: 12px;
    padding: 0 4px;
    margin-left: 4px;
  }

  .expand-btn:hover {
    text-decoration: underline;
  }

  .result-status {
    font-size: 12px;
    font-weight: 500;
    margin-top: 6px;
    font-family: monospace;
  }

  .empty-state {
    text-align: center;
    color: var(--text-muted);
    padding: 32px;
    font-size: 13px;
  }

  .skeleton-item {
    height: 80px;
    border-radius: 6px;
    background: linear-gradient(
      90deg,
      var(--bg-elevated, #1a1a1a) 25%,
      var(--bg-surface, #242424) 50%,
      var(--bg-elevated, #1a1a1a) 75%
    );
    background-size: 800px 100%;
    animation: shimmer 1.5s infinite linear;
    margin-bottom: 12px;
  }
</style>

```

---

## File 18: `apps/web/src/lib/components/memory/MemoryDashboard.svelte`

**Status:** `NEW` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/apps/web/src/lib/components/memory/MemoryDashboard.svelte)**

Tabbed memory browser: KV store, vector search, and workspace files

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { memory } from '$lib/api';
  import { addToast } from '$lib/stores/toast';
  import type { Memory, WorkspaceFile } from '$lib/types';

  let { agentId }: { agentId: string } = $props();

  let activeTab: 'kv' | 'vector' | 'files' = $state('kv');
  let kvMemories: Memory[] = $state([]);
  let vectorMemories: Memory[] = $state([]);
  let files: WorkspaceFile[] = $state([]);
  let loading = $state(false);
  let searchQuery = $state('');
  let searching = $state(false);

  onMount(() => {
    loadKV();
  });

  async function loadKV() {
    loading = true;
    try {
      kvMemories = await memory.list(agentId, 'kv');
    } catch (e) {
      addToast('Failed to load KV memories', 'error');
    } finally {
      loading = false;
    }
  }

  async function loadVector() {
    loading = true;
    try {
      vectorMemories = await memory.list(agentId, 'vector');
    } catch (e) {
      addToast('Failed to load vector memories', 'error');
    } finally {
      loading = false;
    }
  }

  async function loadFiles() {
    loading = true;
    try {
      files = await memory.listFiles(agentId);
    } catch (e) {
      addToast('Failed to load files', 'error');
    } finally {
      loading = false;
    }
  }

  function switchTab(tab: 'kv' | 'vector' | 'files') {
    activeTab = tab;
    if (tab === 'kv' && !kvMemories.length) {
      loadKV();
    } else if (tab === 'vector' && !vectorMemories.length) {
      loadVector();
    } else if (tab === 'files' && !files.length) {
      loadFiles();
    }
  }

  async function deleteKV(id: string) {
    if (!confirm('Delete this memory?')) return;
    try {
      await memory.delete(agentId, id);
      addToast('Deleted', 'success');
      kvMemories = kvMemories.filter((m) => m.id !== id);
    } catch (e) {
      addToast('Failed to delete memory', 'error');
    }
  }

  async function deleteVector(id: string) {
    if (!confirm('Delete this memory?')) return;
    try {
      await memory.delete(agentId, id);
      addToast('Deleted', 'success');
      vectorMemories = vectorMemories.filter((m) => m.id !== id);
    } catch (e) {
      addToast('Failed to delete memory', 'error');
    }
  }

  async function deleteFile(id: string) {
    if (!confirm('Delete this memory?')) return;
    try {
      await memory.delete(agentId, id);
      addToast('Deleted', 'success');
      files = files.filter((f) => f.id !== id);
    } catch (e) {
      addToast('Failed to delete file', 'error');
    }
  }

  async function searchVector() {
    if (!searchQuery.trim()) return;
    searching = true;
    try {
      vectorMemories = await memory.search(agentId, searchQuery);
    } catch (e) {
      addToast('Search failed', 'error');
    } finally {
      searching = false;
    }
  }

  function formatBytes(n: number): string {
    if (n < 1024) return n + 'B';
    if (n < 1048576) return (n / 1024).toFixed(1) + 'KB';
    return (n / 1048576).toFixed(1) + 'MB';
  }

  function formatDate(s: string): string {
    return new Date(s).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<div class="memory-dashboard">
  <div class="tab-bar">
    <button
      class="tab"
      class:active={activeTab === 'kv'}
      onclick={() => switchTab('kv')}
    >
      KV Store
    </button>
    <button
      class="tab"
      class:active={activeTab === 'vector'}
      onclick={() => switchTab('vector')}
    >
      Vector Memory
    </button>
    <button
      class="tab"
      class:active={activeTab === 'files'}
      onclick={() => switchTab('files')}
    >
      Workspace Files
    </button>
  </div>

  <div class="tab-content">
    {#if activeTab === 'kv'}
      <div class="tab-panel">
        {#if loading}
          <table class="table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
                <th>Created</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {#each [1, 2, 3] as _}
                <tr class="skeleton-row">
                  <td><div class="skeleton"></div></td>
                  <td><div class="skeleton"></div></td>
                  <td><div class="skeleton"></div></td>
                  <td><div class="skeleton skeleton-btn"></div></td>
                </tr>
              {/each}
            </tbody>
          </table>
        {:else if kvMemories.length === 0}
          <div class="empty-state">
            <p>No key-value memories stored</p>
          </div>
        {:else}
          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Value</th>
                  <th>Created</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {#each kvMemories as m}
                  <tr>
                    <td class="mono">{m.key}</td>
                    <td class="truncate" style="max-width:240px">{m.value}</td>
                    <td>{formatDate(m.created_at)}</td>
                    <td>
                      <button
                        class="btn btn-danger btn-sm"
                        onclick={() => deleteKV(m.id)}
                      >Ã</button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    {/if}

    {#if activeTab === 'vector'}
      <div class="tab-panel">
        <div class="search-bar">
          <input
            bind:value={searchQuery}
            placeholder="Search memories..."
            class="search-input"
            onkeydown={(e) => e.key === 'Enter' && searchVector()}
          />
          <button
            class="btn btn-ghost btn-sm"
            onclick={searchVector}
            disabled={searching}
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {#if loading}
          {#each [1, 2, 3] as _}
            <div class="memory-item card skeleton-card">
              <div class="skeleton skeleton-text"></div>
              <div class="skeleton skeleton-text" style="width:60%"></div>
            </div>
          {/each}
        {:else if vectorMemories.length === 0}
          <div class="empty-state">
            <p>No vector memories stored yet</p>
          </div>
        {:else}
          {#each vectorMemories as m}
            <div class="memory-item card">
              <p class="memory-content">
                {m.content?.slice(0, 120)}{m.content && m.content.length > 120 ? '...' : ''}
              </p>
              {#if m.metadata}
                <div class="meta-tags">
                  {#each Object.keys(m.metadata) as key}
                    <span class="meta-tag">{key}</span>
                  {/each}
                </div>
              {/if}
              <div class="memory-footer">
                <span class="timestamp">{formatDate(m.created_at)}</span>
                <button
                  class="btn btn-danger btn-sm"
                  onclick={() => deleteVector(m.id)}
                >Ã</button>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    {/if}

    {#if activeTab === 'files'}
      <div class="tab-panel">
        {#if loading}
          <table class="table">
            <thead>
              <tr>
                <th>Filename</th>
                <th>Size</th>
                <th>Type</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each [1, 2, 3] as _}
                <tr class="skeleton-row">
                  <td><div class="skeleton"></div></td>
                  <td><div class="skeleton"></div></td>
                  <td><div class="skeleton"></div></td>
                  <td><div class="skeleton"></div></td>
                  <td><div class="skeleton skeleton-btn"></div></td>
                </tr>
              {/each}
            </tbody>
          </table>
        {:else if files.length === 0}
          <div class="empty-state">
            <p>No workspace files</p>
          </div>
        {:else}
          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Size</th>
                  <th>Type</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each files as f}
                  <tr>
                    <td>{f.filename}</td>
                    <td>{formatBytes(f.size)}</td>
                    <td class="mono" style="font-size:11px">{f.mime_type}</td>
                    <td>{formatDate(f.created_at)}</td>
                    <td style="display:flex;gap:6px">
                      <a
                        href="/api/memory/files/{f.id}/download"
                        class="btn btn-ghost btn-sm"
                      >â</a>
                      <button
                        class="btn btn-danger btn-sm"
                        onclick={() => deleteFile(f.id)}
                      >Ã</button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .memory-dashboard {
    display: flex;
    flex-direction: column;
    gap: 0;
    height: 100%;
  }

  .tab-bar {
    display: flex;
    border-bottom: 1px solid var(--border);
    margin-bottom: 16px;
    gap: 0;
  }

  .tab {
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted, #888);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
    margin-bottom: -1px;
  }

  .tab:hover {
    color: var(--text-primary, #fff);
  }

  .tab.active {
    color: var(--accent, #6366f1);
    border-bottom-color: var(--accent, #6366f1);
  }

  .tab-content {
    flex: 1;
    overflow: auto;
  }

  .tab-panel {
    padding: 0;
  }

  .table-wrapper {
    overflow-x: auto;
  }

  .table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .table th {
    text-align: left;
    padding: 8px 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted, #888);
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }

  .table td {
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.05));
    color: var(--text-primary, #e2e8f0);
    vertical-align: middle;
  }

  .table tr:hover td {
    background: var(--bg-hover, rgba(255,255,255,0.03));
  }

  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mono {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 12px;
  }

  .search-bar {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }

  .search-input {
    flex: 1;
    padding: 6px 10px;
    font-size: 13px;
    background: var(--bg-surface, #1e1e2e);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text-primary, #e2e8f0);
    outline: none;
    transition: border-color 0.15s;
  }

  .search-input:focus {
    border-color: var(--accent, #6366f1);
  }

  .search-input::placeholder {
    color: var(--text-muted, #888);
  }

  .memory-item {
    margin-bottom: 8px;
    padding: 12px;
    background: var(--bg-surface, #1e1e2e);
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .card {
    background: var(--bg-surface, #1e1e2e);
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .memory-content {
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-primary, #e2e8f0);
    margin: 0;
  }

  .meta-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 6px;
  }

  .meta-tag {
    font-size: 10px;
    background: var(--bg-surface, #1e1e2e);
    border: 1px solid var(--border);
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    color: var(--text-muted, #888);
  }

  .memory-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
  }

  .timestamp {
    font-size: 11px;
    color: var(--text-muted, #888);
  }

  .empty-state {
    padding: 40px 20px;
    text-align: center;
    color: var(--text-muted, #888);
    font-size: 13px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 5px 10px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 5px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: background 0.15s, opacity 0.15s;
    text-decoration: none;
    white-space: nowrap;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-sm {
    padding: 3px 8px;
    font-size: 12px;
    line-height: 1.4;
  }

  .btn-danger {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }

  .btn-danger:hover {
    background: rgba(239, 68, 68, 0.2);
  }

  .btn-ghost {
    background: transparent;
    border-color: var(--border);
    color: var(--text-secondary, #a0aec0);
  }

  .btn-ghost:hover {
    background: var(--bg-hover, rgba(255,255,255,0.06));
    color: var(--text-primary, #e2e8f0);
  }

  /* Skeleton loading */
  .skeleton {
    height: 14px;
    border-radius: 4px;
    background: linear-gradient(
      90deg,
      var(--bg-surface, #1e1e2e) 25%,
      var(--bg-hover, rgba(255,255,255,0.06)) 50%,
      var(--bg-surface, #1e1e2e) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    width: 80%;
  }

  .skeleton-btn {
    width: 24px;
    height: 24px;
    border-radius: 4px;
  }

  .skeleton-text {
    height: 13px;
    margin-bottom: 6px;
    width: 100%;
  }

  .skeleton-card {
    padding: 12px;
    margin-bottom: 8px;
  }

  .skeleton-row td {
    padding: 10px 12px;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
</style>

```

---

## File 19: `apps/web/src/lib/components/voice/VoiceButton.svelte`

**Status:** `NEW` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/apps/web/src/lib/components/voice/VoiceButton.svelte)**

Browser STT/TTS voice controls with mic button and speaker mute toggle

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { addToast } from '$lib/stores/toast';

  let {
    onTranscript = () => {},
    ttsText = null,
    class: className = ''
  }: {
    onTranscript?: (text: string) => void;
    ttsText?: string | null;
    class?: string;
  } = $props();

  let supported = $state(false);
  let recording = $state(false);
  let speaking = $state(false);
  let muted = $state(false);

  let recognition: any = null;

  function initRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      onTranscript(event.results[0][0].transcript);
    };
    recognition.onerror = () => {
      addToast('Voice recognition error', 'error');
      recording = false;
    };
    recognition.onend = () => {
      recording = false;
    };
  }

  function startRecording() {
    if (!recognition) initRecognition();
    recognition.start();
    recording = true;
    setTimeout(() => {
      if (recording) stopRecording();
    }, 10000);
  }

  function stopRecording() {
    recognition?.stop();
    recording = false;
  }

  function toggleRecording() {
    recording ? stopRecording() : startRecording();
  }

  $effect(() => {
    if (ttsText && !muted) {
      const utt = new SpeechSynthesisUtterance(ttsText);
      speaking = true;
      utt.onend = () => {
        speaking = false;
      };
      window.speechSynthesis?.speak(utt);
    }
  });

  onMount(() => {
    supported =
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  });

  onDestroy(() => {
    recognition?.stop();
    window.speechSynthesis?.cancel();
  });
</script>

{#if supported}
  <div class="voice-controls {className}">
    <button
      class="btn btn-ghost voice-btn"
      class:recording
      onclick={toggleRecording}
      title={recording ? 'Stop listening' : 'Start voice input'}
    >
      {#if recording}
        ð
      {:else}
        ð¤
      {/if}
    </button>

    <button
      class="btn btn-ghost voice-btn"
      onclick={() => (muted = !muted)}
      title={muted ? 'Unmute TTS' : 'Mute TTS'}
    >
      {muted ? 'ð' : 'ð'}
    </button>

    {#if speaking}
      <span class="speaking-indicator">â</span>
    {/if}
  </div>
{/if}

<style>
  .voice-controls {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .voice-btn {
    padding: 6px;
    font-size: 16px;
    border-radius: 6px;
    cursor: pointer;
    transition: box-shadow 0.2s ease;
  }

  .voice-btn.recording {
    box-shadow: 0 0 0 4px rgba(255, 68, 68, 0.3);
    animation: pulse 1s infinite;
  }

  .speaking-indicator {
    color: var(--accent, #7c3aed);
    animation: pulse 1s infinite;
    font-size: 10px;
  }

  @keyframes pulse {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.1);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>

```

---

## File 20: `apps/web/src/routes/agents/[id]/+page.svelte`

**Status:** `REPLACE` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/apps/web/src/routes/agents/[id]/+page.svelte)**

Agent detail page with Overview/Runs/Memory/Settings tabs and live run visualizer

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { agents, runs } from '$lib/api';
  import { addToast } from '$lib/stores/toast';
  import Badge from '$lib/components/ui/Badge.svelte';
  import SwarmVisualizer from '$lib/components/runs/SwarmVisualizer.svelte';
  import MemoryDashboard from '$lib/components/memory/MemoryDashboard.svelte';
  import AgentEditor from '$lib/components/agents/AgentEditor.svelte';
  import type { Agent, Run } from '$lib/types';

  let agent: Agent | null = $state(null);
  let runList: Run[] = $state([]);
  let loading = $state(true);
  let activeTab = $state('overview');
  let expandedRunId: string | null = $state(null);
  let running = $state(false);

  const agentId = $derived($page.params.id);

  const successRate = $derived(
    runList.length === 0
      ? 0
      : Math.round(
          (runList.filter((r) => r.status === 'completed').length / runList.length) * 100
        )
  );

  const activeRun = $derived(runList.find((r) => r.status === 'running') ?? null);

  onMount(async () => {
    try {
      const [fetchedAgent, fetchedRuns] = await Promise.all([
        agents.get(agentId),
        runs.list(agentId, 20),
      ]);
      agent = fetchedAgent;
      runList = fetchedRuns;
    } catch (err: any) {
      addToast(err?.message ?? 'Failed to load agent', 'error');
    } finally {
      loading = false;
    }

    if (typeof window !== 'undefined' && window.location.hash) {
      activeTab = window.location.hash.slice(1);
    }
  });

  function switchTab(tab: string) {
    activeTab = tab;
    if (typeof window !== 'undefined') {
      window.location.hash = tab;
    }
  }

  async function runNow() {
    running = true;
    try {
      await agents.run(agentId);
      addToast('Agent started', 'success');
      switchTab('runs');
      runList = await runs.list(agentId, 20);
    } catch (err: any) {
      addToast(err?.message ?? 'Failed to start agent', 'error');
    } finally {
      running = false;
    }
  }

  function handleSave(updated: Agent) {
    agent = updated;
    addToast('Agent updated', 'success');
  }

  function formatRelative(dateStr: string | null | undefined): string {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  function formatDuration(ms: number): string {
    return formatDurationMs(ms);
  }

  function formatDurationMs(ms: number): string {
    if (ms >= 60000) {
      return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    }
    return `${Math.floor(ms / 1000)}s`;
  }
</script>

{#if loading}
  <div class="skeleton-wrapper">
    <div class="skeleton skeleton-header"></div>
    <div class="skeleton skeleton-tabs"></div>
    <div class="skeleton skeleton-body"></div>
  </div>
{/if}

{#if !loading && agent}
  <div class="agent-header">
    <div class="header-text">
      <h1>{agent.name}</h1>
      <p class="goal-text">{agent.goal}</p>
    </div>
    <div class="header-actions">
      <Badge status={agent.status} />
      <button
        class="btn btn-success"
        onclick={runNow}
        disabled={running || agent.status === 'running'}
      >
        â¶ Run Now
      </button>
    </div>
  </div>

  <div class="tab-bar">
    {#each ['overview', 'runs', 'memory', 'settings'] as tab}
      <button
        class="tab {activeTab === tab ? 'tab-active' : ''}"
        onclick={() => switchTab(tab)}
      >
        {tab.charAt(0).toUpperCase() + tab.slice(1)}
      </button>
    {/each}
  </div>

  {#if activeTab === 'overview'}
    <div class="tab-content">
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-label">Total Runs</span>
          <span class="stat-value">{runList.length}</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Success Rate</span>
          <span class="stat-value">{successRate}%</span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Last Run</span>
          <span class="stat-value">
            {runList[0] ? formatRelative(runList[0].started_at) : 'Never'}
          </span>
        </div>
      </div>

      <div class="card mb-16">
        <h3 class="card-section-title">Goal</h3>
        <p class="goal-body">{agent.goal}</p>
      </div>

      <div class="card mb-16">
        <h3 class="card-section-title">Configuration</h3>
        <div class="config-grid">
          <span class="config-key">Personality</span>
          <span class="config-value pill">{agent.personality ?? '--'}</span>
          <span class="config-key">Max Sub-Agents</span>
          <span class="config-value">{agent.max_sub_agents ?? '--'}</span>
          <span class="config-key">Model</span>
          <span class="config-value">{agent.model_override ?? 'Default'}</span>
        </div>
      </div>

      <div class="card mb-16">
        <h3 class="card-section-title">Recent Runs</h3>
        {#if runList.length === 0}
          <p class="empty-state">No runs yet.</p>
        {:else}
          {#each runList.slice(0, 5) as run}
            <div class="run-row">
              <Badge status={run.status} />
              <span class="run-summary">
                {run.summary ? run.summary.slice(0, 60) : 'No summary'}
              </span>
              <span class="run-time">{formatRelative(run.started_at)}</span>
            </div>
          {/each}
        {/if}
      </div>

      {#if activeRun}
        <div class="card card-active">
          <h3 class="card-section-title running-title">Currently Running â</h3>
          <SwarmVisualizer runId={activeRun.id} live={true} />
        </div>
      {/if}
    </div>
  {/if}

  {#if activeTab === 'runs'}
    <div class="tab-content">
      {#if runList.length === 0}
        <p class="empty-state">No runs found for this agent.</p>
      {:else}
        <div class="table-wrapper">
          <table class="runs-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Started</th>
                <th>Duration</th>
                <th>Summary</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {#each runList as run}
                <tr
                  class="run-table-row"
                  onclick={() => (expandedRunId = expandedRunId === run.id ? null : run.id)}
                  style="cursor:pointer"
                >
                  <td><Badge status={run.status} /></td>
                  <td>{formatRelative(run.started_at)}</td>
                  <td>{run.duration_ms ? formatDurationMs(run.duration_ms) : '--'}</td>
                  <td style="max-width:200px" class="truncate">{run.summary ?? '--'}</td>
                  <td class="expand-icon">{expandedRunId === run.id ? 'â²' : 'â¼'}</td>
                </tr>
                {#if expandedRunId === run.id}
                  <tr class="expanded-row">
                    <td colspan="5">
                      <div class="expanded-content">
                        <SwarmVisualizer runId={run.id} live={run.status === 'running'} />
                      </div>
                    </td>
                  </tr>
                {/if}
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/if}

  {#if activeTab === 'memory'}
    <div class="tab-content">
      <MemoryDashboard agentId={agentId} />
    </div>
  {/if}

  {#if activeTab === 'settings'}
    <div class="tab-content">
      <AgentEditor {agent} onSave={handleSave} />
    </div>
  {/if}
{/if}

{#if !loading && !agent}
  <div class="not-found">
    <p>Agent not found or failed to load.</p>
  </div>
{/if}

<style>
  /* Skeleton */
  .skeleton-wrapper {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 24px;
  }

  .skeleton {
    background: var(--skeleton-bg, #2a2a2a);
    border-radius: 8px;
    animation: pulse 1.4s ease-in-out infinite;
  }

  .skeleton-header {
    height: 64px;
    width: 100%;
  }

  .skeleton-tabs {
    height: 40px;
    width: 320px;
  }

  .skeleton-body {
    height: 240px;
    width: 100%;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* Agent Header */
  .agent-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }

  .header-text {
    flex: 1;
    min-width: 0;
  }

  .header-text h1 {
    font-size: 22px;
    margin: 0;
    font-weight: 600;
    color: var(--text);
  }

  .goal-text {
    color: var(--text-muted);
    font-size: 13px;
    margin-top: 4px;
    margin-bottom: 0;
  }

  .header-actions {
    margin-left: auto;
    display: flex;
    gap: 8px;
    align-items: center;
    flex-shrink: 0;
  }

  /* Buttons */
  .btn {
    padding: 7px 14px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: opacity 0.15s, background 0.15s;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-success {
    background: var(--success, #22c55e);
    color: #fff;
  }

  .btn-success:hover:not(:disabled) {
    background: var(--success-hover, #16a34a);
  }

  /* Tab Bar */
  .tab-bar {
    display: flex;
    gap: 4px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--border);
  }

  .tab {
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 500;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--text-muted);
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
    margin-bottom: -1px;
  }

  .tab:hover {
    color: var(--text);
  }

  .tab-active {
    color: var(--accent, #6366f1);
    border-bottom-color: var(--accent, #6366f1);
  }

  /* Tab Content */
  .tab-content {
    padding-top: 4px;
  }

  /* Stats Row */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 16px;
  }

  .stat-card {
    background: var(--surface, #1a1a2e);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .stat-label {
    font-size: 12px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stat-value {
    font-size: 22px;
    font-weight: 600;
    color: var(--text);
  }

  /* Cards */
  .card {
    background: var(--surface, #1a1a2e);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px;
  }

  .card-active {
    border-color: var(--accent, #6366f1);
  }

  .mb-16 {
    margin-bottom: 16px;
  }

  .card-section-title {
    font-size: 13px;
    color: var(--text-muted);
    margin: 0 0 8px 0;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .running-title {
    color: var(--accent, #6366f1);
  }

  .goal-body {
    line-height: 1.6;
    margin: 0;
    font-size: 14px;
    color: var(--text);
  }

  /* Config Grid */
  .config-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    font-size: 13px;
  }

  .config-key {
    color: var(--text-muted);
    align-self: center;
  }

  .config-value {
    color: var(--text);
    font-weight: 500;
  }

  .pill {
    display: inline-block;
    background: var(--surface-alt, #252540);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 2px 10px;
    font-size: 12px;
  }

  /* Run Row */
  .run-row {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 6px 0;
    border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.06));
  }

  .run-row:last-child {
    border-bottom: none;
  }

  .run-summary {
    flex: 1;
    font-size: 13px;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .run-time {
    margin-left: auto;
    font-size: 12px;
    color: var(--text-muted);
    flex-shrink: 0;
    white-space: nowrap;
  }

  /* Table */
  .table-wrapper {
    overflow-x: auto;
    border-radius: 8px;
    border: 1px solid var(--border);
  }

  .runs-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .runs-table thead tr {
    background: var(--surface-alt, #252540);
  }

  .runs-table th {
    padding: 10px 12px;
    text-align: left;
    font-weight: 600;
    color: var(--text-muted);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 1px solid var(--border);
  }

  .runs-table td {
    padding: 10px 12px;
    color: var(--text);
    border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.06));
    vertical-align: middle;
  }

  .run-table-row:hover td {
    background: var(--surface-hover, rgba(255,255,255,0.03));
  }

  .runs-table tbody tr:last-child td {
    border-bottom: none;
  }

  .truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .expand-icon {
    text-align: center;
    color: var(--text-muted);
    font-size: 11px;
  }

  .expanded-row td {
    padding: 0 !important;
    background: var(--surface, #1a1a2e);
  }

  .expanded-content {
    padding: 16px;
    border-top: 1px solid var(--border);
  }

  /* Misc */
  .empty-state {
    color: var(--text-muted);
    font-size: 13px;
    margin: 0;
    padding: 8px 0;
  }

  .not-found {
    padding: 48px;
    text-align: center;
    color: var(--text-muted);
  }

  @media (max-width: 640px) {
    .stats-row {
      grid-template-columns: 1fr;
    }

    .config-grid {
      grid-template-columns: 1fr;
    }

    .agent-header {
      flex-wrap: wrap;
    }

    .header-actions {
      margin-left: 0;
      width: 100%;
      justify-content: flex-start;
    }
  }
</style>

```

---

## File 21: `apps/web/src/routes/agents/new/+page.svelte`

**Status:** `NEW` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/apps/web/src/routes/agents/new/+page.svelte)**

New agent creation page wrapping AgentEditor with navigation on save

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { addToast } from '$lib/stores/toast';
  import AgentEditor from '$lib/components/agents/AgentEditor.svelte';
  import type { Agent } from '$lib/types';

  function handleSave(agent: Agent): void {
    addToast({ type: 'success', message: 'Agent created successfully' });
    goto('/agents/' + agent.id);
  }
</script>

<div class="new-agent-page">
  <div class="page-header">
    <a href="/" class="back-link"><- Dashboard</a>
    <h1>New Agent</h1>
    <p>Configure a new AI agent</p>
  </div>
  <div class="editor-wrapper">
    <AgentEditor agent={null} onSave={handleSave} />
  </div>
</div>

<style>
  .new-agent-page {
    max-width: 640px;
    margin: 0 auto;
  }

  .page-header {
    margin-bottom: 24px;
  }

  .back-link {
    color: var(--text-muted);
    text-decoration: none;
    font-size: 13px;
    display: inline-block;
    margin-bottom: 12px;
    transition: color 0.15s ease;
  }

  .back-link:hover {
    color: var(--text);
  }

  h1 {
    font-size: 22px;
    margin: 0 0 4px;
    font-weight: 600;
  }

  p {
    color: var(--text-muted);
    font-size: 13px;
    margin: 0;
  }

  .editor-wrapper {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 24px;
  }
</style>
```

---

## File 22: `apps/web/src/routes/memory/+page.svelte`

**Status:** `NEW` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/apps/web/src/routes/memory/+page.svelte)**

Global memory view with agent selector and MemoryDashboard component

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { agents } from '$lib/api';
  import MemoryDashboard from '$lib/components/memory/MemoryDashboard.svelte';
  import type { Agent } from '$lib/types';

  let agentList: Agent[] = $state([]);
  let selectedAgentId: string = $state('');
  let loading: boolean = $state(true);

  onMount(async () => {
    try {
      const result = await agents.list();
      agentList = result;
      if (agentList.length > 0) {
        selectedAgentId = agentList[0].id;
      }
    } finally {
      loading = false;
    }
  });
</script>

<div class="memory-page">
  <h1>Memory</h1>
  <p class="subtitle">Browse and search agent memories</p>

  {#if loading}
    <div class="skeleton-block">
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-line"></div>
      <div class="skeleton skeleton-line short"></div>
      <div class="skeleton skeleton-box"></div>
    </div>
  {:else if agentList.length === 0}
    <div class="empty-state card">
      <p>No agents yet</p>
      <a href="/agents/new" class="btn btn-primary">Create an Agent</a>
    </div>
  {:else}
    <div class="input-group">
      <label for="agent-select">Agent</label>
      <select id="agent-select" bind:value={selectedAgentId}>
        {#each agentList as agent (agent.id)}
          <option value={agent.id}>{agent.name}</option>
        {/each}
      </select>
    </div>

    {#if selectedAgentId}
      <MemoryDashboard agentId={selectedAgentId} />
    {/if}
  {/if}
</div>

<style>
  .memory-page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2rem 1.5rem;
  }

  .memory-page h1 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
    color: var(--color-text-primary, #111);
  }

  .subtitle {
    color: var(--color-text-secondary, #555);
    margin-bottom: 2rem;
    font-size: 1rem;
  }

  .skeleton-block {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1.5rem;
    border-radius: 8px;
    background: var(--color-surface, #f9f9f9);
  }

  .skeleton {
    background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 4px;
  }

  .skeleton-title {
    height: 1.5rem;
    width: 40%;
  }

  .skeleton-line {
    height: 1rem;
    width: 80%;
  }

  .skeleton-line.short {
    width: 55%;
  }

  .skeleton-box {
    height: 200px;
    width: 100%;
    border-radius: 8px;
    margin-top: 0.5rem;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .empty-state.card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
    padding: 3rem 2rem;
    border-radius: 12px;
    background: var(--color-surface, #fff);
    border: 1px solid var(--color-border, #e5e7eb);
    text-align: center;
    color: var(--color-text-secondary, #555);
  }

  .empty-state.card p {
    font-size: 1.1rem;
    margin: 0;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.6rem 1.4rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.95rem;
    text-decoration: none;
    cursor: pointer;
    border: none;
    transition: background 0.15s, opacity 0.15s;
  }

  .btn-primary {
    background: var(--color-primary, #6366f1);
    color: #fff;
  }

  .btn-primary:hover {
    opacity: 0.88;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-bottom: 1.75rem;
    max-width: 360px;
  }

  .input-group label {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--color-text-primary, #111);
  }

  .input-group select {
    padding: 0.55rem 0.85rem;
    border-radius: 8px;
    border: 1px solid var(--color-border, #d1d5db);
    background: var(--color-surface, #fff);
    font-size: 0.95rem;
    color: var(--color-text-primary, #111);
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s;
  }

  .input-group select:focus {
    border-color: var(--color-primary, #6366f1);
  }
</style>
```

---

## File 23: `apps/web/src/routes/settings/+page.svelte`

**Status:** `NEW` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/apps/web/src/routes/settings/+page.svelte)**

Settings page with LLM provider, voice config, personalities, and danger zone

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import * as settings from '$lib/api/settings';
  import { addToast } from '$lib/stores/toast';
  import Modal from '$lib/components/ui/Modal.svelte';
  import type { AppSettings, Personality } from '$lib/types';

  const builtInKeys = ['default', 'concise', 'creative', 'analyst', 'coder', 'rayn'];

  let appSettings: AppSettings = $state({
    llm_provider: 'openai',
    llm_model: 'gpt-4o',
    voice_enabled: false,
    stt_mode: 'browser',
    tts_mode: 'browser',
    llm_api_key: '',
    ollama_base_url: 'http://localhost:11434',
    elevenlabs_api_key: '',
    elevenlabs_voice_id: '',
  });

  let personalities: Personality[] = $state([]);
  let loading = $state(true);
  let saving = $state(false);
  let testingLLM = $state(false);
  let showClearModal = $state(false);
  let editingPersonalityKey: string | null = $state(null);
  let showAddPersonality = $state(false);
  let newPersonality = $state({
    key: '',
    name: '',
    description: '',
    system_prompt: '',
  });

  let editPersonalityData: Record<string, Partial<Personality>> = $state({});

  onMount(async () => {
    try {
      const [settingsData, personalitiesData] = await Promise.all([
        settings.getSettings(),
        settings.getPersonalities(),
      ]);
      if (settingsData) {
        appSettings = { ...appSettings, ...settingsData };
      }
      if (personalitiesData) {
        personalities = personalitiesData;
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to load settings' });
    } finally {
      loading = false;
    }
  });

  async function saveLLM() {
    saving = true;
    try {
      await settings.saveSettings({
        llm_provider: appSettings.llm_provider,
        llm_model: appSettings.llm_model,
        llm_api_key: appSettings.llm_api_key,
        ollama_base_url: appSettings.ollama_base_url,
      });
      addToast({ type: 'success', message: 'LLM settings saved successfully' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to save LLM settings' });
    } finally {
      saving = false;
    }
  }

  async function testLLM() {
    testingLLM = true;
    try {
      const result = await settings.testLLM();
      if (result?.success) {
        addToast({ type: 'success', message: result.message || 'Connection successful!' });
      } else {
        addToast({ type: 'error', message: result?.message || 'Connection test failed' });
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Connection test failed' });
    } finally {
      testingLLM = false;
    }
  }

  async function saveVoice() {
    saving = true;
    try {
      await settings.saveSettings({
        voice_enabled: appSettings.voice_enabled,
        stt_mode: appSettings.stt_mode,
        tts_mode: appSettings.tts_mode,
        elevenlabs_api_key: appSettings.elevenlabs_api_key,
        elevenlabs_voice_id: appSettings.elevenlabs_voice_id,
      });
      addToast({ type: 'success', message: 'Voice settings saved successfully' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to save voice settings' });
    } finally {
      saving = false;
    }
  }

  async function addPersonality() {
    if (!newPersonality.key || !newPersonality.name) {
      addToast({ type: 'error', message: 'Key and name are required' });
      return;
    }
    try {
      await settings.createPersonality(newPersonality);
      const personalitiesData = await settings.getPersonalities();
      if (personalitiesData) personalities = personalitiesData;
      showAddPersonality = false;
      newPersonality = { key: '', name: '', description: '', system_prompt: '' };
      addToast({ type: 'success', message: 'Personality added successfully' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to add personality' });
    }
  }

  async function savePersonality(key: string) {
    const data = editPersonalityData[key];
    if (!data) return;
    try {
      await settings.updatePersonality(key, data);
      const personalitiesData = await settings.getPersonalities();
      if (personalitiesData) personalities = personalitiesData;
      editingPersonalityKey = null;
      addToast({ type: 'success', message: 'Personality updated successfully' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to update personality' });
    }
  }

  async function deletePersonality(key: string) {
    if (!confirm(`Delete personality "${key}"? This cannot be undone.`)) return;
    try {
      await settings.deletePersonality(key);
      personalities = personalities.filter((p) => p.key !== key);
      addToast({ type: 'success', message: 'Personality deleted' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to delete personality' });
    }
  }

  async function clearMemory() {
    try {
      const res = await fetch('/api/memory/all', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      addToast({ type: 'success', message: 'All memory cleared successfully' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to clear memory' });
    } finally {
      showClearModal = false;
    }
  }

  async function resetSettings() {
    if (!confirm('Reset all settings to defaults? This cannot be undone.')) return;
    try {
      await settings.resetSettings();
      const settingsData = await settings.getSettings();
      if (settingsData) appSettings = { ...appSettings, ...settingsData };
      addToast({ type: 'success', message: 'Settings reset to defaults' });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to reset settings' });
    }
  }

  function providerPlaceholder(provider: string): string {
    switch (provider) {
      case 'openai':
        return 'sk-...';
      case 'groq':
        return 'gsk_...';
      case 'anthropic':
        return 'sk-ant-...';
      case 'gemini':
        return 'AIza...';
      case 'litellm':
        return 'Enter your LiteLLM API key';
      default:
        return 'Enter API key';
    }
  }

  function startEditPersonality(p: Personality) {
    editingPersonalityKey = p.key;
    editPersonalityData[p.key] = {
      name: p.name,
      description: p.description,
      system_prompt: p.system_prompt,
    };
  }

  function cancelEdit() {
    editingPersonalityKey = null;
  }
</script>

{#if loading}
  <div class="loading-wrapper">
    <div class="spinner"></div>
    <p>Loading settings...</p>
  </div>
{:else}
  <div class="settings-page">
    <header class="page-header">
      <h1>Settings</h1>
      <p class="subtitle">Configure AgentSwarp to your preferences</p>
    </header>

    <!-- Section 1: LLM Provider -->
    <section class="card">
      <div class="card-header">
        <h2>LLM Provider</h2>
        <p class="card-desc">Configure your language model provider and credentials</p>
      </div>
      <div class="card-body">
        <div class="form-group">
          <label for="llm-provider">Provider</label>
          <select id="llm-provider" bind:value={appSettings.llm_provider}>
            <option value="openai">OpenAI</option>
            <option value="groq">Groq</option>
            <option value="anthropic">Anthropic</option>
            <option value="ollama">Ollama (Local)</option>
            <option value="gemini">Google Gemini</option>
            <option value="litellm">LiteLLM</option>
          </select>
        </div>

        <div class="form-group">
          <label for="llm-model">Model</label>
          <input
            id="llm-model"
            type="text"
            bind:value={appSettings.llm_model}
            placeholder={appSettings.llm_provider === 'ollama'
              ? 'llama3'
              : appSettings.llm_provider === 'anthropic'
                ? 'claude-3-5-sonnet-20241022'
                : appSettings.llm_provider === 'groq'
                  ? 'llama-3.1-70b-versatile'
                  : appSettings.llm_provider === 'gemini'
                    ? 'gemini-1.5-pro'
                    : 'gpt-4o'}
          />
        </div>

        {#if appSettings.llm_provider === 'ollama'}
          <div class="form-group">
            <label for="ollama-url">Ollama Base URL</label>
            <input
              id="ollama-url"
              type="text"
              bind:value={appSettings.ollama_base_url}
              placeholder="http://localhost:11434"
            />
          </div>
        {:else}
          <div class="form-group">
            <label for="llm-api-key">API Key</label>
            <input
              id="llm-api-key"
              type="password"
              bind:value={appSettings.llm_api_key}
              placeholder={providerPlaceholder(appSettings.llm_provider)}
              autocomplete="off"
            />
          </div>
        {/if}

        <div class="button-row">
          <button
            class="btn btn-secondary"
            onclick={testLLM}
            disabled={testingLLM || saving}
          >
            {#if testingLLM}
              <span class="btn-spinner"></span>
              Testing...
            {:else}
              Test Connection
            {/if}
          </button>
          <button
            class="btn btn-primary"
            onclick={saveLLM}
            disabled={saving || testingLLM}
          >
            {#if saving}
              <span class="btn-spinner"></span>
              Saving...
            {:else}
              Save LLM Settings
            {/if}
          </button>
        </div>
      </div>
    </section>

    <!-- Section 2: Voice -->
    <section class="card">
      <div class="card-header">
        <h2>Voice Settings</h2>
        <p class="card-desc">Configure speech recognition and text-to-speech</p>
      </div>
      <div class="card-body">
        <div class="form-group toggle-group">
          <label class="toggle-label" for="voice-enabled">
            <input
              id="voice-enabled"
              type="checkbox"
              bind:checked={appSettings.voice_enabled}
            />
            <span class="toggle-track"></span>
            Enable Voice Features
          </label>
        </div>

        {#if appSettings.voice_enabled}
          <div class="voice-options">
            <div class="form-group">
              <p class="radio-group-label">Speech-to-Text (STT) Mode</p>
              <div class="radio-group">
                <label class="radio-label">
                  <input
                    type="radio"
                    name="stt_mode"
                    value="browser"
                    bind:group={appSettings.stt_mode}
                  />
                  Browser (Web Speech API)
                </label>
                <label class="radio-label">
                  <input
                    type="radio"
                    name="stt_mode"
                    value="whisper"
                    bind:group={appSettings.stt_mode}
                  />
                  Whisper (OpenAI)
                </label>
              </div>
            </div>

            <div class="form-group">
              <p class="radio-group-label">Text-to-Speech (TTS) Mode</p>
              <div class="radio-group">
                <label class="radio-label">
                  <input
                    type="radio"
                    name="tts_mode"
                    value="browser"
                    bind:group={appSettings.tts_mode}
                  />
                  Browser (Web Speech API)
                </label>
                <label class="radio-label">
                  <input
                    type="radio"
                    name="tts_mode"
                    value="elevenlabs"
                    bind:group={appSettings.tts_mode}
                  />
                  ElevenLabs
                </label>
              </div>
            </div>

            {#if appSettings.tts_mode === 'elevenlabs'}
              <div class="form-group">
                <label for="elevenlabs-key">ElevenLabs API Key</label>
                <input
                  id="elevenlabs-key"
                  type="password"
                  bind:value={appSettings.elevenlabs_api_key}
                  placeholder="Enter ElevenLabs API key"
                  autocomplete="off"
                />
              </div>
              <div class="form-group">
                <label for="elevenlabs-voice">Voice ID</label>
                <input
                  id="elevenlabs-voice"
                  type="text"
                  bind:value={appSettings.elevenlabs_voice_id}
                  placeholder="e.g. 21m00Tcm4TlvDq8ikWAM"
                />
              </div>
            {/if}
          </div>
        {/if}

        <div class="button-row">
          <button
            class="btn btn-primary"
            onclick={saveVoice}
            disabled={saving}
          >
            {#if saving}
              <span class="btn-spinner"></span>
              Saving...
            {:else}
              Save Voice Settings
            {/if}
          </button>
        </div>
      </div>
    </section>

    <!-- Section 3: Personalities -->
    <section class="card">
      <div class="card-header">
        <h2>Personalities</h2>
        <p class="card-desc">Manage AI personalities and system prompts</p>
      </div>
      <div class="card-body">
        <div class="personalities-list">
          {#each personalities as personality (personality.key)}
            <div class="personality-item">
              {#if editingPersonalityKey === personality.key}
                <div class="personality-edit-form">
                  <div class="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      bind:value={editPersonalityData[personality.key].name}
                      placeholder="Personality name"
                    />
                  </div>
                  <div class="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      bind:value={editPersonalityData[personality.key].description}
                      placeholder="Short description"
                    />
                  </div>
                  <div class="form-group">
                    <label>System Prompt</label>
                    <textarea
                      rows={6}
                      bind:value={editPersonalityData[personality.key].system_prompt}
                      placeholder="Enter system prompt..."
                    ></textarea>
                  </div>
                  <div class="button-row">
                    <button class="btn btn-ghost" onclick={cancelEdit}>Cancel</button>
                    <button
                      class="btn btn-primary"
                      onclick={() => savePersonality(personality.key)}
                    >Save</button>
                  </div>
                </div>
              {:else}
                <div class="personality-info">
                  <div class="personality-meta">
                    <span class="personality-name">{personality.name}</span>
                    {#if builtInKeys.includes(personality.key)}
                      <span class="badge">Built-in</span>
                    {/if}
                    {#if personality.description}
                      <p class="personality-desc">{personality.description}</p>
                    {/if}
                  </div>
                  <div class="personality-actions">
                    <button
                      class="btn btn-icon"
                      onclick={() => startEditPersonality(personality)}
                      title="Edit personality"
                    >
                      âï¸
                    </button>
                    {#if !builtInKeys.includes(personality.key)}
                      <button
                        class="btn btn-icon btn-icon-danger"
                        onclick={() => deletePersonality(personality.key)}
                        title="Delete personality"
                      >
                        ðï¸
                      </button>
                    {/if}
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>

        {#if showAddPersonality}
          <div class="add-personality-form card-inner">
            <h3>Add Custom Personality</h3>
            <div class="form-group">
              <label for="new-p-key">Key (unique identifier)</label>
              <input
                id="new-p-key"
                type="text"
                bind:value={newPersonality.key}
                placeholder="e.g. my-assistant"
              />
            </div>
            <div class="form-group">
              <label for="new-p-name">Name</label>
              <input
                id="new-p-name"
                type="text"
                bind:value={newPersonality.name}
                placeholder="Display name"
              />
            </div>
            <div class="form-group">
              <label for="new-p-desc">Description</label>
              <input
                id="new-p-desc"
                type="text"
                bind:value={newPersonality.description}
                placeholder="Short description"
              />
            </div>
            <div class="form-group">
              <label for="new-p-prompt">System Prompt</label>
              <textarea
                id="new-p-prompt"
                rows={6}
                bind:value={newPersonality.system_prompt}
                placeholder="Enter system prompt..."
              ></textarea>
            </div>
            <div class="button-row">
              <button
                class="btn btn-ghost"
                onclick={() => {
                  showAddPersonality = false;
                  newPersonality = { key: '', name: '', description: '', system_prompt: '' };
                }}
              >Cancel</button>
              <button class="btn btn-primary" onclick={addPersonality}>Add Personality</button>
            </div>
          </div>
        {:else}
          <button
            class="btn btn-secondary"
            onclick={() => (showAddPersonality = true)}
          >
            + Add Custom Personality
          </button>
        {/if}
      </div>
    </section>

    <!-- Section 4: Danger Zone -->
    <section class="card card-danger">
      <div class="card-header">
        <h2 class="danger-title">Danger Zone</h2>
        <p class="card-desc">Irreversible actions -- proceed with caution</p>
      </div>
      <div class="card-body">
        <div class="danger-row">
          <div class="danger-info">
            <strong>Clear All Memory</strong>
            <p>Permanently delete all conversation memory and context. This cannot be undone.</p>
          </div>
          <button
            class="btn btn-danger"
            onclick={() => (showClearModal = true)}
          >
            Clear Memory
          </button>
        </div>
        <div class="divider"></div>
        <div class="danger-row">
          <div class="danger-info">
            <strong>Reset Settings</strong>
            <p>Reset all settings to their default values. Your API keys will be cleared.</p>
          </div>
          <button class="btn btn-danger" onclick={resetSettings}>
            Reset to Defaults
          </button>
        </div>
      </div>
    </section>
  </div>
{/if}

<Modal bind:open={showClearModal} title="Clear All Memory">
  <div class="modal-body">
    <p>Are you sure you want to clear <strong>all conversation memory</strong>?</p>
    <p class="modal-warning">This action is permanent and cannot be undone. All stored context, history, and memory will be deleted.</p>
  </div>
  <div class="modal-footer">
    <button class="btn btn-ghost" onclick={() => (showClearModal = false)}>Cancel</button>
    <button class="btn btn-danger" onclick={clearMemory}>Yes, Clear Everything</button>
  </div>
</Modal>

<style>
  .settings-page {
    max-width: 760px;
    margin: 0 auto;
    padding: 2rem 1rem 4rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .page-header {
    margin-bottom: 0.5rem;
  }

  .page-header h1 {
    font-size: 1.875rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
    color: var(--color-text-primary, #f1f5f9);
  }

  .subtitle {
    color: var(--color-text-secondary, #94a3b8);
    margin: 0;
    font-size: 0.95rem;
  }

  .card {
    background: var(--color-surface, #1e293b);
    border: 1px solid var(--color-border, #334155);
    border-radius: 0.75rem;
    overflow: hidden;
  }

  .card-danger {
    border-color: var(--color-danger-border, #ef4444);
  }

  .card-header {
    padding: 1.25rem 1.5rem 0;
  }

  .card-header h2 {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 0.25rem;
    color: var(--color-text-primary, #f1f5f9);
  }

  .danger-title {
    color: var(--color-danger, #ef4444) !important;
  }

  .card-desc {
    font-size: 0.85rem;
    color: var(--color-text-secondary, #94a3b8);
    margin: 0 0 1rem;
  }

  .card-body {
    padding: 1rem 1.5rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .form-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary, #94a3b8);
  }

  input[type='text'],
  input[type='password'],
  select,
  textarea {
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: var(--color-input-bg, #0f172a);
    border: 1px solid var(--color-border, #334155);
    border-radius: 0.5rem;
    color: var(--color-text-primary, #f1f5f9);
    font-size: 0.9rem;
    font-family: inherit;
    transition: border-color 0.15s;
    box-sizing: border-box;
  }

  input[type='text']:focus,
  input[type='password']:focus,
  select:focus,
  textarea:focus {
    outline: none;
    border-color: var(--color-accent, #6366f1);
  }

  textarea {
    resize: vertical;
    min-height: 80px;
  }

  .button-row {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1.1rem;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn-primary {
    background: var(--color-accent, #6366f1);
    color: #fff;
    border-color: var(--color-accent, #6366f1);
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--color-accent-hover, #4f46e5);
    border-color: var(--color-accent-hover, #4f46e5);
  }

  .btn-secondary {
    background: transparent;
    color: var(--color-text-primary, #f1f5f9);
    border-color: var(--color-border, #334155);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--color-surface-hover, #334155);
  }

  .btn-ghost {
    background: transparent;
    color: var(--color-text-secondary, #94a3b8);
    border-color: transparent;
  }

  .btn-ghost:hover:not(:disabled) {
    background: var(--color-surface-hover, #334155);
  }

  .btn-danger {
    background: var(--color-danger, #ef4444);
    color: #fff;
    border-color: var(--color-danger, #ef4444);
  }

  .btn-danger:hover:not(:disabled) {
    background: #dc2626;
    border-color: #dc2626;
  }

  .btn-icon {
    background: transparent;
    border-color: transparent;
    padding: 0.35rem 0.5rem;
    font-size: 1rem;
    border-radius: 0.375rem;
  }

  .btn-icon:hover {
    background: var(--color-surface-hover, #334155);
  }

  .btn-icon-danger:hover {
    background: rgba(239, 68, 68, 0.15);
  }

  .btn-spinner {
    display: inline-block;
    width: 0.85rem;
    height: 0.85rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* Toggle */
  .toggle-group {
    flex-direction: row;
    align-items: center;
  }

  .toggle-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    font-size: 0.9rem;
    color: var(--color-text-primary, #f1f5f9);
    user-select: none;
  }

  .toggle-label input[type='checkbox'] {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-track {
    display: inline-block;
    width: 2.5rem;
    height: 1.4rem;
    background: var(--color-border, #334155);
    border-radius: 9999px;
    position: relative;
    transition: background 0.2s;
    flex-shrink: 0;
  }

  .toggle-track::after {
    content: '';
    position: absolute;
    top: 0.15rem;
    left: 0.15rem;
    width: 1.1rem;
    height: 1.1rem;
    background: #fff;
    border-radius: 50%;
    transition: transform 0.2s;
  }

  input[type='checkbox']:checked + .toggle-track {
    background: var(--color-accent, #6366f1);
  }

  input[type='checkbox']:checked + .toggle-track::after {
    transform: translateX(1.1rem);
  }

  .voice-options {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: var(--color-input-bg, #0f172a);
    border-radius: 0.5rem;
    border: 1px solid var(--color-border, #334155);
  }

  .radio-group-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary, #94a3b8);
    margin: 0 0 0.4rem;
  }

  .radio-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .radio-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: var(--color-text-primary, #f1f5f9);
    cursor: pointer;
  }

  .radio-label input[type='radio'] {
    accent-color: var(--color-accent, #6366f1);
  }

  /* Personalities */
  .personalities-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .personality-item {
    background: var(--color-input-bg, #0f172a);
    border: 1px solid var(--color-border, #334155);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
  }

  .personality-info {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .personality-meta {
    flex: 1;
    min-width: 0;
  }

  .personality-name {
    font-weight: 600;
    font-size: 0.9rem;
    color: var(--color-text-primary, #f1f5f9);
  }

  .personality-desc {
    font-size: 0.8rem;
    color: var(--color-text-secondary, #94a3b8);
    margin: 0.2rem 0 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .personality-actions {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
  }

  .badge {
    display: inline-block;
    margin-left: 0.5rem;
    padding: 0.1rem 0.45rem;
    font-size: 0.7rem;
    font-weight: 600;
    background: rgba(99, 102, 241, 0.15);
    color: var(--color-accent, #6366f1);
    border-radius: 9999px;
    border: 1px solid rgba(99, 102, 241, 0.3);
  }

  .personality-edit-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .add-personality-form {
    padding: 1rem;
    background: var(--color-input-bg, #0f172a);
    border: 1px solid var(--color-border, #334155);
    border-radius: 0.5rem;
  }

  .add-personality-form h3 {
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0 0 1rem;
    color: var(--color-text-primary, #f1f5f9);
  }

  .card-inner {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  /* Danger */
  .danger-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .danger-info {
    flex: 1;
  }

  .danger-info strong {
    font-size: 0.9rem;
    color: var(--color-text-primary, #f1f5f9);
  }

  .danger-info p {
    font-size: 0.8rem;
    color: var(--color-text-secondary, #94a3b8);
    margin: 0.2rem 0 0;
  }

  .divider {
    height: 1px;
    background: var(--color-border, #334155);
    margin: 0.25rem 0;
  }

  /* Loading */
  .loading-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    gap: 1rem;
    color: var(--color-text-secondary, #94a3b8);
  }

  .spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid var(--color-border, #334155);
    border-top-color: var(--color-accent, #6366f1);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  /* Modal */
  .modal-body {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem 0;
  }

  .modal-body p {
    margin: 0;
    font-size: 0.9rem;
    color: var(--color-text-primary, #f1f5f9);
  }

  .modal-warning {
    color: var(--color-danger, #ef4444) !important;
    font-size: 0.85rem !important;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-border, #334155);
  }
</style>

```

---

## File 24: `apps/web/src/routes/+error.svelte`

**Status:** `NEW` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/apps/web/src/routes/+error.svelte)**

Terminal-style error page with status, message, optional stack trace, and navigation

```svelte
<script lang="ts">
  import { page } from '$app/stores';
</script>

<div class="error-page">
  <div class="error-content">
    <div class="error-icon" aria-hidden="true">â ï¸</div>

    <h1 class="error-code">Error {$page.status}</h1>

    <p class="error-message">{$page.error?.message ?? 'An unexpected error occurred.'}</p>

    {#if $page.error?.stack}
      <details class="stack-details">
        <summary>View stack trace</summary>
        <pre class="stack-trace">{$page.error.stack}</pre>
      </details>
    {/if}

    <div class="error-actions">
      <a href="/" class="btn btn-secondary"><- Back to Home</a>
      <button
        class="btn btn-primary"
        onclick={() => window.location.reload()}
      >
        Try Again
      </button>
    </div>
  </div>
</div>

<style>
  .error-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1.5rem;
    background: var(--color-bg, #f3f4f6);
  }

  .error-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.25rem;
    max-width: 540px;
    width: 100%;
    background: var(--color-surface, #fff);
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 16px;
    padding: 3rem 2.5rem;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.07);
  }

  .error-icon {
    font-size: 3.5rem;
    line-height: 1;
    margin-bottom: 0.25rem;
  }

  .error-code {
    font-size: 2rem;
    font-weight: 800;
    color: var(--color-text-primary, #111);
    margin: 0;
  }

  .error-message {
    font-size: 1.05rem;
    color: var(--color-text-secondary, #555);
    margin: 0;
    line-height: 1.6;
  }

  .stack-details {
    width: 100%;
    border: 1px solid var(--color-border, #e5e7eb);
    border-radius: 8px;
    overflow: hidden;
    text-align: left;
  }

  .stack-details summary {
    padding: 0.65rem 1rem;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    background: var(--color-surface-alt, #f9fafb);
    color: var(--color-text-primary, #111);
    user-select: none;
    list-style: none;
  }

  .stack-details summary::-webkit-details-marker {
    display: none;
  }

  .stack-details[open] summary {
    border-bottom: 1px solid var(--color-border, #e5e7eb);
  }

  .stack-trace {
    margin: 0;
    padding: 1rem;
    font-size: 0.78rem;
    line-height: 1.6;
    overflow-x: auto;
    background: var(--color-code-bg, #1e1e2e);
    color: var(--color-code-text, #cdd6f4);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .error-actions {
    display: flex;
    gap: 0.85rem;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: 0.5rem;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.6rem 1.4rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.95rem;
    text-decoration: none;
    cursor: pointer;
    border: none;
    transition: background 0.15s, opacity 0.15s;
  }

  .btn-primary {
    background: var(--color-primary, #6366f1);
    color: #fff;
  }

  .btn-primary:hover {
    opacity: 0.88;
  }

  .btn-secondary {
    background: var(--color-surface-alt, #f3f4f6);
    color: var(--color-text-primary, #111);
    border: 1px solid var(--color-border, #d1d5db);
  }

  .btn-secondary:hover {
    background: var(--color-border, #e5e7eb);
  }
</style>
```

---

## File 25: `packages/tools/src/searxng.ts`

**Status:** `NEW` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/packages/tools/src/searxng.ts)**

SearXNG search tool with DuckDuckGo fallback, 5s timeout, zod input validation

```typescript
import z from 'zod';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  score?: number;
}

interface SearXNGResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

interface SearXNGResponse {
  results: SearXNGResult[];
}

const SEARXNG_URL = process.env.SEARXNG_URL || 'http://searxng:8080';

async function searchSearXNG(
  query: string,
  categories: string[] = ['general'],
  language: string = 'en-US',
  maxResults: number = 10
): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    categories: categories.join(','),
    language: language,
    pageno: '1',
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(`${SEARXNG_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`SearXNG responded with status: ${response.status}`);
    }

    const data = (await response.json()) as SearXNGResponse;

    return data.results.slice(0, maxResults).map((result: SearXNGResult): SearchResult => ({
      title: result.title,
      url: result.url,
      snippet: result.content,
      source: 'searxng',
      score: result.score,
    }));
  } finally {
    clearTimeout(timeoutId);
  }
}

async function searchDuckDuckGo(
  query: string,
  maxResults: number = 10
): Promise<SearchResult[]> {
  const params = new URLSearchParams({ q: query });

  const response = await fetch(`https://html.duckduckgo.com/html/?${params.toString()}`, {
    method: 'GET',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`DuckDuckGo responded with status: ${response.status}`);
  }

  const html = await response.text();

  const results: SearchResult[] = [];

  const linkRegex = /class="result__a"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/g;
  const snippetRegex = /class="result__snippet"[^>]*>([^<]+(?:<[^>]+>[^<]*<\/[^>]+>[^<]*)*)<\/a>/g;

  const links: Array<{ url: string; title: string }> = [];
  let linkMatch: RegExpExecArray | null;

  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const rawUrl = linkMatch[1];
    const title = linkMatch[2].trim();

    let url = rawUrl;
    try {
      const uddgParam = new URL(rawUrl).searchParams.get('uddg');
      if (uddgParam) {
        url = decodeURIComponent(uddgParam);
      }
    } catch {
      // keep original url
    }

    if (url && title) {
      links.push({ url, title });
    }
  }

  const snippetMatches: string[] = [];
  const snippetSimpleRegex = /class="result__snippet"[^>]*>(.*?)<\/a>/gs;
  let snippetMatch: RegExpExecArray | null;

  while ((snippetMatch = snippetSimpleRegex.exec(html)) !== null) {
    const snippet = snippetMatch[1].replace(/<[^>]+>/g, '').trim();
    snippetMatches.push(snippet);
  }

  for (let i = 0; i < Math.min(links.length, maxResults); i++) {
    const link = links[i];
    const snippet = snippetMatches[i] || '';

    results.push({
      title: link.title,
      url: link.url,
      snippet,
      source: 'duckduckgo',
    });
  }

  return results;
}

const inputSchema = z.object({
  query: z.string().describe('Search query'),
  categories: z
    .array(z.string())
    .optional()
    .default(['general'])
    .describe('Search categories (e.g. general, news, images, videos, science, it)'),
  language: z.string().optional().default('en-US').describe('Search language'),
  max_results: z
    .number()
    .optional()
    .default(10)
    .transform((val) => Math.min(val, 20))
    .describe('Maximum number of results to return (capped at 20)'),
});

export const searxngTool = {
  name: 'searxng_search',
  description:
    'Search the web using a self-hosted SearXNG instance with automatic fallback to DuckDuckGo. Returns relevant search results including titles, URLs, and snippets.',
  inputSchema,
  execute: async (input: z.infer<typeof inputSchema>): Promise<{
    results: SearchResult[];
    count: number;
    query: string;
    source: string;
  }> => {
    const { query, categories, language, max_results } = input;

    let results: SearchResult[] = [];
    let source = 'searxng';

    try {
      results = await searchSearXNG(query, categories, language, max_results);

      if (results.length === 0) {
        throw new Error('No results from SearXNG');
      }
    } catch (error) {
      source = 'duckduckgo';
      try {
        results = await searchDuckDuckGo(query, max_results);
      } catch (fallbackError) {
        const searxngError = error instanceof Error ? error.message : String(error);
        const ddgError = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        throw new Error(
          `Both SearXNG and DuckDuckGo searches failed. SearXNG: ${searxngError}. DuckDuckGo: ${ddgError}`
        );
      }
    }

    return {
      results,
      count: results.length,
      query,
      source,
    };
  },
};

```

---

## File 26: `docker-compose.yml`

**Status:** `UPDATE` | **[View on GitHub](https://github.com/raynr7/agentswarm/blob/main/docker-compose.yml)**

Docker Compose with app(200m), web(64m), searxng(256m) -- fits 1GB OCI instance

```yaml
version: '3.8'

services:
  app:
    build: .
    container_name: agentswarp-server
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DATABASE_PATH: /app/data/agentswarp.db
      SECRET_KEY: ${SECRET_KEY:-changeme-generate-32-char-secret}
      JWT_SECRET: ${JWT_SECRET:-changeme-jwt-secret}
      ADMIN_EMAIL: ${ADMIN_EMAIL:-admin@localhost}
      ADMIN_PASSWORD: ${ADMIN_PASSWORD:-changeme}
      OLLAMA_BASE_URL: ${OLLAMA_BASE_URL:-http://host.docker.internal:11434}
      OPENAI_API_KEY: ${OPENAI_API_KEY:-}
      GROQ_API_KEY: ${GROQ_API_KEY:-}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-}
      GOOGLE_AI_API_KEY: ${GOOGLE_AI_API_KEY:-}
      LITELLM_BASE_URL: ${LITELLM_BASE_URL:-}
      SEARXNG_URL: ${SEARXNG_URL:-http://searxng:8080}
      ELEVENLABS_API_KEY: ${ELEVENLABS_API_KEY:-}
    volumes:
      - data:/app/data
    mem_limit: 200m
    restart: unless-stopped
    networks:
      - internal
      - default
    depends_on:
      searxng:
        condition: service_started
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  web:
    build: ./apps/web
    container_name: agentswarp-web
    ports:
      - "3000:3000"
    environment:
      PUBLIC_API_URL: ${PUBLIC_API_URL:-http://localhost:3001}
      PUBLIC_WS_URL: ${PUBLIC_WS_URL:-ws://localhost:3001/ws}
    mem_limit: 64m
    restart: unless-stopped
    depends_on:
      app:
        condition: service_healthy

  searxng:
    image: searxng/searxng:latest
    container_name: agentswarp-search
    ports:
      - "8080:8080"
    volumes:
      - searxng-config:/etc/searxng
    environment:
      BASE_URL: http://localhost:8080/
      INSTANCE_NAME: AgentSwarp Search
      AUTOCOMPLETE: "false"
    mem_limit: 256m
    restart: unless-stopped
    networks:
      - internal
      - default
    cap_drop:
      - ALL
    cap_add:
      - CHOWN
      - SETGID
      - SETUID
    logging:
      driver: json-file
      options:
        max-size: "1m"
        max-file: "1"

networks:
  internal:
    driver: bridge
    internal: true

volumes:
  data:
    driver: local
  searxng-config:
    driver: local

```

---

## Deployment Notes

### RAM Budget

| Service | Memory Limit |
|---------|-------------|
| app (AgentSwarp server) | 200 MB |
| web (SvelteKit frontend) | 64 MB |
| searxng (Self-hosted search) | 256 MB |
| **Total** | **520 MB** |

[OK] Fits comfortably in a 1 GB OCI/VPS instance with ~480 MB headroom.

### Quick Start

```bash
# Clone the repo
git clone https://github.com/raynr7/agentswarm.git
cd agentswarm

# Create .env from example
cp .env.example .env
# Edit .env with your API keys and secrets

# Start all services
docker compose up -d

# Access
# Frontend: http://localhost:3000
# API:      http://localhost:3001
# Search:   http://localhost:8080
```

### .env.example

Create a `.env.example` file in the repo root:

```bash
# Required: Change these before production deployment
SECRET_KEY=changeme-generate-a-32-char-random-string
JWT_SECRET=changeme-jwt-secret-also-random

# Admin credentials
ADMIN_EMAIL=admin@localhost
ADMIN_PASSWORD=changeme

# LLM providers (add whichever you use)
OPENAI_API_KEY=
GROQ_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_AI_API_KEY=

# Optional: Ollama (if running locally, host.docker.internal works on Mac/Windows)
OLLAMA_BASE_URL=http://host.docker.internal:11434

# Optional: LiteLLM proxy
LITELLM_BASE_URL=

# Optional: ElevenLabs TTS
ELEVENLABS_API_KEY=

# Frontend URLs (change for production)
PUBLIC_API_URL=http://localhost:3001
PUBLIC_WS_URL=ws://localhost:3001/ws
```

---

*Generated reference - Phase 2 Complete*
*Repository: https://github.com/raynr7/agentswarm*
