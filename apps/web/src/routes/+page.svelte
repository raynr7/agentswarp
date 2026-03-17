<script>
  import { onMount } from 'svelte';
  import { api } from '$lib/api';

  let agents = [];
  let recentRuns = [];
  let loading = true;

  onMount(async () => {
    try {
      [agents, recentRuns] = await Promise.all([
        api.agents.list(),
        api.runs.list(),
      ]);
    } catch (err) {
      console.error('Failed to load:', err);
    } finally {
      loading = false;
    }
  });

  function statusColor(status) {
    const colors = { active: 'bg-green-500', paused: 'bg-yellow-500', draft: 'bg-gray-500' };
    return colors[status] || 'bg-gray-500';
  }

  function runStatusColor(status) {
    const colors = { success: 'text-green-400', fail: 'text-red-400', running: 'text-blue-400', queued: 'text-gray-400', partial: 'text-yellow-400' };
    return colors[status] || 'text-gray-400';
  }

  async function runAgent(id) {
    try {
      await api.agents.run(id);
      recentRuns = await api.runs.list();
    } catch (err) {
      alert('Failed to run agent: ' + err.message);
    }
  }
</script>

<div class="space-y-8">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <h1 class="text-2xl font-bold text-white">Your Agents</h1>
    <a href="/agents/new" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors">
      + New Agent
    </a>
  </div>

  {#if loading}
    <div class="text-gray-400 text-center py-12">Loading...</div>
  {:else if agents.length === 0}
    <!-- Empty state -->
    <div class="text-center py-16 bg-gray-800/50 rounded-xl border border-gray-700">
      <div class="text-5xl mb-4">ð</div>
      <h2 class="text-xl font-semibold text-white mb-2">No agents yet</h2>
      <p class="text-gray-400 mb-6">Create your first agent to start automating.</p>
      <a href="/agents/new" class="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg transition-colors">
        Create Your First Agent
      </a>
    </div>
  {:else}
    <!-- Agent grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {#each agents as agent}
        <a href="/agents/{agent.id}" class="block bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition-colors">
          <div class="flex items-center gap-3 mb-3">
            <span class="text-2xl">{agent.icon || 'ð¤'}</span>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-white truncate">{agent.name}</h3>
              <div class="flex items-center gap-2 mt-1">
                <span class="w-2 h-2 rounded-full {statusColor(agent.status)}"></span>
                <span class="text-xs text-gray-400 capitalize">{agent.status}</span>
              </div>
            </div>
          </div>
          <p class="text-sm text-gray-400 line-clamp-2 mb-4">{agent.goal || 'No goal set'}</p>
          <button
            class="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
            on:click|preventDefault|stopPropagation={() => runAgent(agent.id)}
          >
            â¶ Run Now
          </button>
        </a>
      {/each}
    </div>
  {/if}

  <!-- Recent runs -->
  {#if recentRuns.length > 0}
    <div>
      <h2 class="text-lg font-semibold text-white mb-4">Recent Runs</h2>
      <div class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-750">
            <tr class="border-b border-gray-700">
              <th class="text-left px-4 py-3 text-gray-400 font-medium">Agent</th>
              <th class="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
              <th class="text-left px-4 py-3 text-gray-400 font-medium">Summary</th>
              <th class="text-left px-4 py-3 text-gray-400 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {#each recentRuns.slice(0, 10) as run}
              <tr class="border-b border-gray-700/50 hover:bg-gray-750">
                <td class="px-4 py-3 text-white">{run.agent_icon || 'ð¤'} {run.agent_name || 'Unknown'}</td>
                <td class="px-4 py-3 {runStatusColor(run.status)} capitalize">{run.status}</td>
                <td class="px-4 py-3 text-gray-400 truncate max-w-xs">{run.outcome_summary || '--'}</td>
                <td class="px-4 py-3 text-gray-500">{new Date(run.created_at).toLocaleString()}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
