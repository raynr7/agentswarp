<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { connected } from '$lib/stores/ws';
  import { initTheme, setTheme, theme } from '$lib/stores/theme';
  import CommandPalette from '$lib/components/layout/CommandPalette.svelte';
  import Toast from '$lib/components/ui/Toast.svelte';

  let cmdOpen = $state(false);
  let currentTheme = $state('dark');

  let themeUnsub: () => void;

  function handleKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      cmdOpen = true;
    }
  }

  onMount(() => {
    initTheme();
    themeUnsub = theme.subscribe((val) => {
      currentTheme = val;
    });
    window.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    if (themeUnsub) themeUnsub();
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', handleKeydown);
    }
  });

  const navItems = [
    {
      section: 'AGENTS',
      links: [
        { href: '/', icon: 'ÃÂ¢ÃÂÃÂ¦', label: 'Dashboard' },
        { href: '/agents', icon: 'ÃÂ¢ÃÂÃÂ', label: 'Agents' },
        { href: '/chat', icon: 'ð¬', label: 'Chat' },
      ],
    },
    {
      section: 'WORKSPACE',
      links: [
        { href: '/memory', icon: 'ÃÂ¢ÃÂÃÂ', label: 'Memory' },
        { href: '/integrations', icon: 'ÃÂ¢ÃÂÃÂ³', label: 'Integrations' },
        { href: '/skills', icon: 'ÃÂ¢ÃÂÃÂ', label: 'Skills' },
        { href: '/vibe', icon: 'â¨', label: 'Vibe Coder' },
      ],
    },
    {
      section: 'SYSTEM',
      links: [
        { href: '/settings', icon: 'ÃÂ¢ÃÂÃÂ', label: 'Settings' },
      ],
    },
  ];

  function isActive(href: string, pathname: string): boolean {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname === href || pathname.startsWith(href + '/');
  }

  function toggleTheme() {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }

  $effect(() => {
    if (typeof window === 'undefined') return
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault()
        const path = window.location.pathname
        if (path === '/vibe') history.back()
        else window.location.href = '/vibe'
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })
</script>

<div class="layout">
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="brand">
        <h1>AgentSwarp</h1>
      </div>
      <div class="brand-sub">
        <span class="version">v0.2.0</span>
        <span
          class="connection-dot"
          class:connected={$connected}
          title={$connected ? 'Connected' : 'Disconnected'}
        ></span>
      </div>
    </div>

    <nav class="sidebar-nav">
      {#each navItems as section}
        <div class="nav-section">
          <span class="nav-section-label">{section.section}</span>
          {#each section.links as link}
            <a
              href={link.href}
              class="sidebar-link"
              class:active={isActive(link.href, $page.url.pathname)}
            >
              <span class="icon">{link.icon}</span>
              <span class="label">{link.label}</span>
            </a>
          {/each}
        </div>
      {/each}
    </nav>

    <div class="sidebar-bottom">
      <button
        class="btn btn-ghost btn-sm theme-toggle"
        onclick={toggleTheme}
        type="button"
      >
        {#if currentTheme === 'dark'}
          ÃÂ¢ÃÂÃÂ Light mode
        {:else}
          ÃÂ°ÃÂÃÂÃÂ Dark mode
        {/if}
      </button>
      <p class="search-hint">Cmd+K for search</p>
    </div>
  </aside>

  <main class="main-content">
    <slot />
  </main>
</div>

<CommandPalette bind:open={cmdOpen} />
<Toast />

<style>
  .layout {
    display: flex;
    min-height: 100vh;
  }

  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    width: 220px;
    height: 100vh;
    background: var(--bg-surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding: 16px 0;
    z-index: 100;
    overflow-y: auto;
  }

  .sidebar-header {
    padding: 0 16px 16px;
    border-bottom: 1px solid var(--border);
  }

  .brand h1 {
    font-family: 'JetBrains Mono', monospace;
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    margin: 0;
  }

  .brand-sub {
    display: flex;
    align-items: center;
    margin-top: 6px;
  }

  .version {
    font-size: 11px;
    color: var(--text-muted);
  }

  .connection-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-left: auto;
    background: #ff4444;
    flex-shrink: 0;
  }

  .connection-dot.connected {
    background: #00ff88;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(0, 255, 136, 0.6);
      opacity: 1;
    }
    50% {
      box-shadow: 0 0 0 5px rgba(0, 255, 136, 0);
      opacity: 0.8;
    }
    100% {
      box-shadow: 0 0 0 0 rgba(0, 255, 136, 0);
      opacity: 1;
    }
  }

  .sidebar-nav {
    flex: 1;
    padding: 8px 0;
  }

  .nav-section {
    margin-bottom: 8px;
  }

  .nav-section-label {
    display: block;
    padding: 8px 16px 4px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    text-transform: uppercase;
    user-select: none;
  }

  .sidebar-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 16px;
    color: var(--text-muted);
    text-decoration: none;
    font-size: 14px;
    font-weight: 400;
    border-radius: 0;
    transition: background 0.15s ease, color 0.15s ease;
    position: relative;
  }

  .sidebar-link:hover {
    background: var(--bg-hover, rgba(255, 255, 255, 0.05));
    color: var(--text);
  }

  .sidebar-link.active {
    background: var(--bg-active, rgba(99, 102, 241, 0.15));
    color: var(--accent, #6366f1);
    font-weight: 500;
  }

  .sidebar-link.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--accent, #6366f1);
    border-radius: 0 2px 2px 0;
  }

  .sidebar-link .icon {
    font-size: 14px;
    width: 18px;
    text-align: center;
    flex-shrink: 0;
    opacity: 0.85;
  }

  .sidebar-link .label {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sidebar-bottom {
    margin-top: auto;
    padding: 16px;
    border-top: 1px solid var(--border);
  }

  .theme-toggle {
    display: flex;
    align-items: center;
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 8px 10px;
    border-radius: 6px;
    font-size: 13px;
    color: var(--text-muted);
    gap: 8px;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .theme-toggle:hover {
    background: var(--bg-hover, rgba(255, 255, 255, 0.05));
    color: var(--text);
  }

  .search-hint {
    margin: 8px 0 0;
    font-size: 11px;
    color: var(--text-muted);
    text-align: center;
    opacity: 0.7;
  }

  .main-content {
    margin-left: 220px;
    min-height: 100vh;
    padding: 24px;
    box-sizing: border-box;
    flex: 1;
    background: var(--bg, #0f0f0f);
  }
</style>

