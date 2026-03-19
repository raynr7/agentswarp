import { writable, get } from 'svelte/store'

type Theme = 'dark' | 'light' | 'system'

const STORAGE_KEY = 'agentswarp-theme'

const _theme = writable<Theme>('dark')

export const theme = {
  subscribe: _theme.subscribe,
}

function applyTheme(t: Theme): void {
  if (typeof window === 'undefined') return

  if (t === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
  } else {
    document.documentElement.setAttribute('data-theme', t)
  }
}

export function setTheme(t: Theme): void {
  _theme.set(t)
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, t)
  }
  applyTheme(t)
}

export function initTheme(): void {
  if (typeof window === 'undefined') return

  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  const resolved: Theme = stored ?? 'dark'
  _theme.set(resolved)
  applyTheme(resolved)
}

export function toggleTheme(): void {
  const current = get(_theme)
  const next: Theme = current === 'dark' ? 'light' : 'dark'
  setTheme(next)
}
