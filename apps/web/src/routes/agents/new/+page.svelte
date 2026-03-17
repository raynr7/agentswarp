<script>
  import { goto } from '$app/navigation';
  import { api } from '$lib/api';

  let step = 1;
  let goal = '';
  let name = '';
  let icon = 'ð¤';
  let provider = 'ollama';
  let creating = false;

  const icons = ['ð¤', 'ð§', 'ð', 'ð', 'ð¬', 'ð', 'ð¯', 'ð', 'ð¡ï¸', 'ð¡', 'ð', 'ðï¸', 'ð', 'â¡', 'ð', 'ð'];

  const providers = [
    { id: 'ollama', name: 'Ollama', desc: 'Free, offline, local', badge: 'FREE' },
    { id: 'groq', name: 'Groq', desc: 'Fast, free tier available', badge: 'FREE TIER' },
    { id: 'openai', name: 'OpenAI', desc: 'GPT-4o, pay per use', badge: '' },
    { id: 'anthropic', name: 'Anthropic', desc: 'Claude, pay per use', badge: '' },
  ];

  async function createAgent() {
    creating = true;
    try {
      const agent = await api.agents.create({ name: name || 'Untitled Agent', goal, icon, status: 'active' });
      goto(`/agents/${agent.id}`);
    } catch (err) {
      alert('Failed to create agent: ' + err.message);
    } finally {
      creating = false;
    }
  }
</script>

<div class="max-w-2xl mx-auto space-y-6">
  <a href="/" class="text-gray-400 hover:text-white text-sm">&larr; Back to Agents</a>
  <h1 class="text-2xl font-bold text-white">Create New Agent</h1>

  <!-- Progress -->
  <div class="flex gap-2">
    {#each [1, 2, 3, 4] as s}
      <div class="flex-1 h-1 rounded-full {s <= step ? 'bg-amber-500' : 'bg-gray-700'}"></div>
    {/each}
  </div>

  {#if step === 1}
    <div class="space-y-4">
      <label class="block text-sm font-medium text-gray-300">What do you want to automate?</label>
      <textarea
        bind:value={goal}
        class="w-full h-40 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
        placeholder="e.g. Every morning, check my Gmail and send me a summary to Slack"
      ></textarea>
      <button
        class="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg disabled:opacity-50"
        disabled={!goal.trim()}
        on:click={() => step = 2}
      >Continue</button>
    </div>

  {:else if step === 2}
    <div class="space-y-4">
      <label class="block text-sm font-medium text-gray-300">Agent Name</label>
      <input
        bind:value={name}
        class="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
        placeholder="My Email Agent"
      />
      <label class="block text-sm font-medium text-gray-300 mt-4">Pick an Icon</label>
      <div class="grid grid-cols-8 gap-2">
        {#each icons as emoji}
          <button
            class="text-2xl p-3 rounded-xl border transition-colors {icon === emoji ? 'border-amber-500 bg-gray-800' : 'border-gray-700 hover:border-gray-600'}"
            on:click={() => icon = emoji}
          >{emoji}</button>
        {/each}
      </div>
      <div class="flex gap-3">
        <button class="px-4 py-2 text-gray-400 hover:text-white" on:click={() => step = 1}>&larr; Back</button>
        <button class="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg" on:click={() => step = 3}>Continue</button>
      </div>
    </div>

  {:else if step === 3}
    <div class="space-y-4">
      <label class="block text-sm font-medium text-gray-300">Choose AI Provider</label>
      <div class="grid grid-cols-1 gap-3">
        {#each providers as p}
          <button
            class="flex items-center justify-between p-4 rounded-xl border transition-colors {provider === p.id ? 'border-amber-500 bg-gray-800' : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'}"
            on:click={() => provider = p.id}
          >
            <div>
              <div class="font-medium text-white">{p.name}</div>
              <div class="text-sm text-gray-400">{p.desc}</div>
            </div>
            {#if p.badge}
              <span class="text-xs px-2 py-1 bg-green-900 text-green-300 rounded-full">{p.badge}</span>
            {/if}
          </button>
        {/each}
      </div>
      <div class="flex gap-3">
        <button class="px-4 py-2 text-gray-400 hover:text-white" on:click={() => step = 2}>&larr; Back</button>
        <button class="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg" on:click={() => step = 4}>Continue</button>
      </div>
    </div>

  {:else if step === 4}
    <div class="space-y-4 bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h2 class="text-lg font-semibold text-white">Review Your Agent</h2>
      <div class="space-y-3 text-sm">
        <div><span class="text-gray-400">Icon:</span> <span class="text-2xl ml-2">{icon}</span></div>
        <div><span class="text-gray-400">Name:</span> <span class="text-white ml-2">{name || 'Untitled Agent'}</span></div>
        <div><span class="text-gray-400">Goal:</span> <span class="text-white ml-2">{goal}</span></div>
        <div><span class="text-gray-400">Provider:</span> <span class="text-white ml-2 capitalize">{provider}</span></div>
      </div>
      <div class="flex gap-3 pt-4">
        <button class="px-4 py-2 text-gray-400 hover:text-white" on:click={() => step = 3}>&larr; Back</button>
        <button
          class="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-black font-medium rounded-lg disabled:opacity-50"
          disabled={creating}
          on:click={createAgent}
        >{creating ? 'Creating...' : 'Create Agent'}</button>
      </div>
    </div>
  {/if}
</div>
