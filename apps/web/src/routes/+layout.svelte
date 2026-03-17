<script>
  import { page } from '$app/stores';
  
  let sidebarOpen = false;
  
  const navItems = [
    { href: '/', label: 'Agents', icon: 'ð¤' },
    { href: '/runs', label: 'Runs', icon: 'â¶ï¸' },
    { href: '/tools', label: 'Tools', icon: 'ð§' },
    { href: '/settings', label: 'Settings', icon: 'âï¸' },
  ];
</script>

<div class="flex h-screen overflow-hidden">
  <!-- Mobile hamburger -->
  <button
    class="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-800 text-white"
    on:click={() => sidebarOpen = !sidebarOpen}
  >
    {sidebarOpen ? 'â' : 'â°'}
  </button>

  <!-- Sidebar -->
  <aside
    class="fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-950 border-r border-gray-800 flex flex-col transform transition-transform lg:translate-x-0"
    class:translate-x-0={sidebarOpen}
    class:-translate-x-full={!sidebarOpen}
  >
    <!-- Logo -->
    <div class="p-6 border-b border-gray-800">
      <a href="/" class="flex items-center gap-3">
        <span class="text-2xl">ð</span>
        <span class="text-xl font-bold text-white">AgentSwarp</span>
      </a>
    </div>

    <!-- Nav -->
    <nav class="flex-1 p-4 space-y-1">
      {#each navItems as item}
        <a
          href={item.href}
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
          class:bg-gray-800={$page.url.pathname === item.href}
          class:text-white={$page.url.pathname === item.href}
          class:text-gray-400={$page.url.pathname !== item.href}
          class:hover:bg-gray-800={$page.url.pathname !== item.href}
          class:hover:text-white={$page.url.pathname !== item.href}
          on:click={() => sidebarOpen = false}
        >
          <span class="text-lg">{item.icon}</span>
          {item.label}
        </a>
      {/each}
    </nav>

    <!-- Footer -->
    <div class="p-4 border-t border-gray-800 text-xs text-gray-500 text-center">
      AgentSwarp v0.1 -- Open Source
    </div>
  </aside>

  <!-- Overlay -->
  {#if sidebarOpen}
    <div class="lg:hidden fixed inset-0 bg-black/50 z-30" on:click={() => sidebarOpen = false} />
  {/if}

  <!-- Main content -->
  <main class="flex-1 overflow-y-auto bg-gray-900">
    <div class="max-w-6xl mx-auto p-6 lg:p-8">
      <slot />
    </div>
  </main>
</div>
