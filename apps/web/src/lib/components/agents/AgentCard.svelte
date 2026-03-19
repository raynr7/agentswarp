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
      Ã¢ÂÂ¶ Run
    </button>
    <a href="/agents/{agent.id}" class="btn btn-ghost btn-sm">Ã¢ÂÂ Edit</a>
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

