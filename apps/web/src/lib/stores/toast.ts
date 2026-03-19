// === FILE: apps/web/src/lib/stores/toast.ts ===
import { writable, derived } from 'svelte/store'
import type { ToastItem } from '../types'

function nanoid(): string {
  return Math.random().toString(36).slice(2, 10)
}

const _toasts = writable<ToastItem[]>([])

export const toasts = derived(_toasts, ($t) => $t.slice(0, 5))

export function addToast(
  message: string,
  type: ToastItem['type'] = 'info',
  duration = 4000
): void {
  const id = nanoid()
  const item: ToastItem = { id, message, type }
  _toasts.update((current) => [...current, item])
  setTimeout(() => removeToast(id), duration)
}

export function removeToast(id: string): void {
  _toasts.update((current) => current.filter((t) => t.id !== id))
}
