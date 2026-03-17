<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { api } from '$lib/api';
  import { connectToRun } from '$lib/websocket';

  let agent = null;
  let runs = [];
  let memory = {};
  let activeTab = 'overview';
  let liveSteps = [];
  let liveRunId = null;
  let loading = true;

  $: agentId = $page.params.id;

  onMount(async () => {
    try {
      [agent, runs] = await Promise.all([
        api.agents.get(agentId),
        api.agents.runs(agentId),
      ]);
    } catch (err) {
      console.error('Failed to load agent:', err);
    } finally {
      loading = false;
    }
  });

  async function loadMemory() {
    memory = await api.agents.memory(agentId);
  }

  async function runAgent() {
    const res = await api.agents.run(agentId);
    liveRunId = res.run_id;
    liveSteps = [];
    activeTab = 'overview';
    
    connectToRun(
      res.run_id,
      (step) => { liveSteps = [...liveSteps, step]; },
      (status) => { liveRunId = null; runs = [{ id: res.run_id, status, created_at: new Date().toISOString() }, ...runs]; }
    );
  }

  function statusColor(s) {
    return { success: 'text-green-400', fail: 'text-red-400', running: 'text-blue-400', queued: 'text-gray-400', partial: 'text-yellow-400' }[s] || 'text-gray-400';
  }

  function stepIcon(type) {
    return { thought: 'ð­', tool_call: 'ð§', tool_result: 'â', final: 'ð' }[type] || 'â¢';
  }
</script>

{#if loading}
  <div class="text-gray-400 text-center py-12">Loading...</div>
{:else if !agent}
  <div class="text-red-400 text-center py-12">Agent not found</div>
{:else}
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <a href="/" class="text-gray-400 hover:text-white">&larr;</a>
      <span class="text-3xl">{agent.icon}</span>
      <div class="flex-1">
        <h1 class="text-2xl font-bold text-white">{agent.name}</h1>
        <p class="text-gray-400 text-sm capitalize">{agent.status}</p>
      </div>
      <button class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg" on:click={runAgent}>â¶ Run Now</button>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 border-b border-gray-700">
      {#each ['overview', 'runs', 'memory', 'settings'] as tab}
        <button
          class="px-4 py-2 text-sm font-medium border-b-2 transition-colors {activeTab === tab ? 'text-white border-amber-500' : 'text-gray-400 border-transparent hover:text-white'}"
          on:click={() => { activeTab = tab; if (tab === 'memory') loadMemory(); }}
        >{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
      {/each}
    </div>

    {#if activeTab === 'overview'}
      <div class="space-y-4">
        <div class="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <h3 class="text-sm font-medium text-gray-400 mb-2">Goal</h3>
          <p class="text-white">{agent.goal || 'No goal set'}</p>
        </div>

        {#if liveRunId}
          <div class="bg-gray-800 rounded-xl p-5 border border-blue-700">
            <h3 class="text-sm font-medium text-blue-400 mb-3">ð´ Live Run</h3>
            <div class="space-y-2">
              {#each liveSteps as step}
                <div class="flex gap-2 text-sm">
                  <span>{stepIcon(step.step_type)}</span>
                  <span class="text-gray-300">{step.content}</span>
                </div>
              {/each}
              <div class="text-blue-400 text-sm animate-pulse">Running...</div>
            </div>
          </div>
        {/if}
      </div>

    {:else if activeTab === 'runs'}
      <div class="space-y-3">
        {#each runs as run}
          <a href="/runs/{run.id}" class="block bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600">
            <div class="flex items-center justify-between">
              <span class="{statusColor(run.status)} capitalize font-medium">{run.status}</span>
              <span class="text-xs text-gray-500">{new Date(run.created_at).toLocaleString()}</span>
            </div>
            <p class="text-gray-400 text-sm mt-1 truncate">{run.outcome_summary || 'No summary'}</p>
          </a>
        {/each}
        {#if runs.length === 0}
          <p class="text-gray-500 text-center py-8">No runs yet</p>
        {/if}
      </div>

    {:else if activeTab === 'memory'}
      <div class="bg-gray-800 rounded-xl p-5 border border-gray-700">
        {#if Object.keys(memory).length === 0}
          <p class="text-gray-500">No memory stored</p>
        {:else}
          <div class="space-y-2">
            {#each Object.entries(memory) as [key, value]}
              <div class="flex gap-4 text-sm">
                <span class="text-amber-400 font-mono">{key}</span>
                <span class="text-gray-300">{value}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>

    {:else if activeTab === 'settings'}
      <div class="bg-gray-800 rounded-xl p-5 border border-gray-700 text-gray-400">
        Agent settings coming in v0.2
      </div>
    {/if}
  </div>
{/if}
