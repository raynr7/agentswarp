export interface RunStepEvent {
  id: string;
  run_id: string;
  step_type: 'thought' | 'tool_call' | 'tool_result' | 'final';
  content: string;
  tool_name?: string;
  tool_input?: string;
  tool_output?: string;
  created_at: string;
}

export function connectToRun(
  runId: string,
  onStep: (step: RunStepEvent) => void,
  onComplete: (status: string) => void
): () => void {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${location.host}/ws`);

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'subscribe', runId }));
  };

  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.type === 'step') onStep(msg.step);
      if (msg.type === 'run_complete') onComplete(msg.status);
    } catch {}
  };

  ws.onerror = (e) => console.error('[WS] Error:', e);

  return () => {
    if (ws.readyState === WebSocket.OPEN) ws.close();
  };
}
