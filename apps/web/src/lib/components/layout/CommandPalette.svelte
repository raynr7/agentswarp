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
      icon: 'Ã¯Â¼Â',
      description: 'Create a new agent',
      action: () => goto('/agents/new'),
    },
    {
      type: 'action',
      label: 'View Memory',
      icon: 'Ã¢ÂÂ',
      description: 'Browse agent memories',
      action: () => goto('/memory'),
    },
    {
      type: 'action',
      label: 'Settings',
      icon: 'Ã¢ÂÂ',
      description: 'Configure LLM and voice',
      action: () => goto('/settings'),
    },
    {
      type: 'action',
      label: 'Toggle Theme',
      icon: 'Ã¢ÂÂ',
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
        icon: 'Ã¢ÂÂ',
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
        icon: 'Ã¢ÂÂ¶',
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

