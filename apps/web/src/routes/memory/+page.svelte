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
