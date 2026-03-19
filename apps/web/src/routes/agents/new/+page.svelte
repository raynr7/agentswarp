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
