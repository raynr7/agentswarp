<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { api } from '$lib/api';

  let run = null;
  let loading = true;

  $: runId = $page.params.id;

  onMount(async () => {
    try {
      run = await api.runs.get(runId);
    } catch (err) {
      console.error('Failed to load run:', err);
    } finally {
      loading = false;
    }
  });

  function stepIcon(type) {
    return { thought: 'ð­', tool_call: 'ð§', tool_result: 'â', final: 'ð' }[type] || 'â¢';
  }

  function stepColor(type) {
    return { thought: 'border-gray-700', tool_call: 'border-blue-700', tool_result: 'border-green-700', final: 'border-amber-700' }[type] || 'border-gray-700';
  }

  function statusColor(s) {
    return { success: 'text-green-400 bg-green-900/30', fail: 'text-red-400 bg-red-900/30', running: 'text-blue-400 bg-blue-900/30', partial: 'text-yellow-400 bg-yellow-900/30' }[s] || 'text-gray-400 bg-gray-800';
  }

  function copyResults() {
    if (!run) return;
    const final = run.steps?.find(s => s.step_type === 'final');
    navigator.clipboard.writeText(final?.content || run.outcome_summary || '');
  }
</script>

{#if loading}
  <div class="text-gray-400 text-center py-12">Loading...</div>
{:else if !run}
  <div class="text-red-400 text-center py-12">Run not found</div>
{:else}
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <a href="/" class="text-gray-400 hover:text-white">&larr;</a>
      <div class="flex-1">
        <h1 class="text-xl font-bold text-white">{run.agent_icon || 'ð¤'} {run.agent_name || 'Agent'} -- Run</h1>
        <div class="flex items-center gap-3 mt-1">
          <span class="text-xs px-2 py-1 rounded-full capitalize {statusColor(run.status)}">{run.status}</span>
          <span class="text-xs text-gray-500">{new Date(run.created_at).toLocaleString()}</span>
        </div>
      </div>
      <button class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg" on:click={copyResults}>ð Copy</button>
    </div>

    <!-- Summary -->
    {#if run.outcome_summary}
      <div class="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <h3 class="text-sm font-medium text-gray-400 mb-2">Summary</h3>
        <p class="text-white">{run.outcome_summary}</p>
      </div>
    {/if}

    <!-- Steps timeline -->
    <div class="space-y-3">
      <h3 class="text-sm font-medium text-gray-400">Steps ({run.steps?.length || 0})</h3>
      {#each run.steps || [] as step, i}
        <div class="bg-gray-800 rounded-xl p-4 border-l-4 {stepColor(step.step_type)}">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-lg">{stepIcon(step.step_type)}</span>
            <span class="text-sm font-medium text-white capitalize">{step.step_type.replace('_', ' ')}</span>
            {#if step.tool_name}
              <span class="text-xs px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded-full">{step.tool_name}</span>
            {/if}
            <span class="text-xs text-gray-500 ml-auto">Step {i + 1}</span>
          </div>
          <p class="text-sm text-gray-300 whitespace-pre-wrap">{step.content}</p>
          {#if step.tool_input}
            <details class="mt-2">
              <summary class="text-xs text-gray-500 cursor-pointer">Input</summary>
              <pre class="text-xs text-gray-400 mt-1 overflow-x-auto bg-gray-900 p-2 rounded">{step.tool_input}</pre>
            </details>
          {/if}
          {#if step.tool_output}
            <details class="mt-2">
              <summary class="text-xs text-gray-500 cursor-pointer">Output</summary>
              <pre class="text-xs text-gray-400 mt-1 overflow-x-auto bg-gray-900 p-2 rounded">{step.tool_output}</pre>
            </details>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}
