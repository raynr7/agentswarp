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
    thought: { color: '#555555', icon: 'Ã°ÂÂÂ­', label: 'Thought' },
    tool_call: { color: '#4488ff', icon: 'Ã¢ÂÂ¡', label: 'Tool Call' },
    tool_result_success: { color: '#00ff88', icon: 'Ã¢ÂÂ', label: 'Result' },
    tool_result_fail: { color: '#ff4444', icon: 'Ã¢ÂÂ', label: 'Result' },
    sub_agent: { color: '#aa44ff', icon: 'Ã¢ÂÂ', label: 'Sub-Agent' },
    message: { color: '#888888', icon: 'Ã°ÂÂÂ¬', label: 'Message' },
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
    <div class="live-badge">Ã¢ÂÂ LIVE</div>
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
                {step.status === 'success' ? 'Ã¢ÂÂ Success' : 'Ã¢ÂÂ Failed'}
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

