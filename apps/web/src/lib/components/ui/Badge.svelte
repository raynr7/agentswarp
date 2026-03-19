<script lang="ts">
  type Status = 'running' | 'success' | 'fail' | 'partial' | 'pending' | 'idle';

  interface Props {
    status?: Status;
    text?: string | undefined;
  }

  let { status = 'pending', text = undefined }: Props = $props();

  const statusLabels: Record<Status, string> = {
    running: 'Running',
    success: 'Success',
    fail: 'Failed',
    partial: 'Partial',
    pending: 'Pending',
    idle: 'Idle',
  };

  const displayText = $derived(text ?? statusLabels[status]);
</script>

{#if status === 'running'}
  <span class="badge badge-running">
    <span class="pulse-dot"></span>
    {displayText}
  </span>
{:else}
  <span class="badge badge-{status}">{displayText}</span>
{/if}

<style>
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    line-height: 1;
    padding: 3px 8px;
    border-radius: 999px;
    white-space: nowrap;
    letter-spacing: 0.02em;
  }

  .badge-running {
    background-color: rgba(34, 197, 94, 0.15);
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  .badge-success {
    background-color: rgba(34, 197, 94, 0.12);
    color: #16a34a;
    border: 1px solid rgba(34, 197, 94, 0.25);
  }

  .badge-fail {
    background-color: rgba(239, 68, 68, 0.12);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.25);
  }

  .badge-partial {
    background-color: rgba(234, 179, 8, 0.12);
    color: #ca8a04;
    border: 1px solid rgba(234, 179, 8, 0.25);
  }

  .badge-pending {
    background-color: rgba(148, 163, 184, 0.12);
    color: #94a3b8;
    border: 1px solid rgba(148, 163, 184, 0.25);
  }

  .badge-idle {
    background-color: rgba(100, 116, 139, 0.1);
    color: #64748b;
    border: 1px solid rgba(100, 116, 139, 0.2);
  }

  .pulse-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #22c55e;
    flex-shrink: 0;
    animation: pulse-dot 1.4s ease-in-out infinite;
  }

  @keyframes pulse-dot {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.4;
      transform: scale(0.75);
    }
  }
</style>

