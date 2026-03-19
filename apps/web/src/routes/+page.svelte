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
          <a href="/agents/new" class="btn btn-success">Ã¯Â¼Â New Agent</a>
          <a href="/agents" class="btn btn-ghost">Ã¢ÂÂ View Agents</a>
          <a href="/memory" class="btn btn-ghost">Ã¢ÂÂ Browse Memory</a>
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

