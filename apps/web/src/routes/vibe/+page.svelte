<script lang="ts">
  import { onMount } from 'svelte'

  type Lang = 'html' | 'css' | 'javascript'

  const STORAGE_KEY = (lang: Lang) => `agentswarp-vibe-${lang}`

  const DEFAULTS: Record<Lang, string> = {
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vibe Preview</title>
  <style>
    body { font-family: system-ui; padding: 2rem; background: #fafafa; color: #111; }
    h1 { color: #00aa55; }
  </style>
</head>
<body>
  <h1>Hello AgentSwarp</h1>
  <p>Start editing on the left to see your changes here.</p>
</body>
</html>`,
    css: `body {
  font-family: system-ui, sans-serif;
  background: #fafafa;
  color: #111;
  padding: 2rem;
}

h1 {
  color: #00aa55;
  font-size: 2rem;
}`,
    javascript: `// JavaScript playground
console.log('Hello AgentSwarp!')

document.addEventListener('DOMContentLoaded', () => {
  const el = document.createElement('h1')
  el.textContent = 'Hello from JS'
  el.style.color = '#00aa55'
  document.body.appendChild(el)
})`
  }

  let lang = $state<Lang>('html')
  let code = $state(DEFAULTS.html)
  let previewSrc = $state('')
  let splitPos = $state(50)
  let dragging = $state(false)
  let containerEl = $state<HTMLDivElement | null>(null)
  let debounceTimer: ReturnType<typeof setTimeout>

  onMount(() => {
    const saved = localStorage.getItem(STORAGE_KEY(lang))
    if (saved) code = saved
    updatePreview()
  })

  function updatePreview() {
    if (lang === 'html') {
      previewSrc = code
    } else if (lang === 'css') {
      previewSrc = `<html><head><style>${code}</style></head><body><h1>Preview</h1><p>Your CSS applied here.</p></body></html>`
    } else {
      previewSrc = `<html><body><script>${code}<\/script></body></html>`
    }
  }

  function handleInput() {
    localStorage.setItem(STORAGE_KEY(lang), code)
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(updatePreview, 500)
  }

  function handleLangChange() {
    const saved = localStorage.getItem(STORAGE_KEY(lang))
    code = saved ?? DEFAULTS[lang]
    updatePreview()
  }

  function handleTab(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      e.preventDefault()
      const t = e.target as HTMLTextAreaElement
      const start = t.selectionStart
      const end = t.selectionEnd
      code = code.slice(0, start) + '  ' + code.slice(end)
      setTimeout(() => { t.selectionStart = t.selectionEnd = start + 2 }, 0)
    }
  }

  function startDrag(e: MouseEvent) {
    dragging = true
    e.preventDefault()
  }

  function onMouseMove(e: MouseEvent) {
    if (!dragging || !containerEl) return
    const rect = containerEl.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.min(Math.max((x / rect.width) * 100, 20), 80)
    splitPos = pct
  }

  function stopDrag() { dragging = false }

  function popOut() {
    const w = window.open('', '_blank', 'width=800,height=600')
    if (w) {
      w.document.write(previewSrc)
      w.document.close()
    }
  }
</script>

<svelte:window onmousemove={onMouseMove} onmouseup={stopDrag} />

<div
  class="vibe-container"
  bind:this={containerEl}
  class:dragging
>
  <div class="pane editor-pane" style="width: {splitPos}%">
    <div class="pane-header">
      <span class="pane-label">Editor</span>
      <select bind:value={lang} onchange={handleLangChange} class="lang-select">
        <option value="html">HTML</option>
        <option value="css">CSS</option>
        <option value="javascript">JavaScript</option>
      </select>
    </div>
    <textarea
      class="code-editor"
      bind:value={code}
      oninput={handleInput}
      onkeydown={handleTab}
      spellcheck={false}
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
    ></textarea>
  </div>

  <div
    class="divider-drag"
    onmousedown={startDrag}
    title="Drag to resize"
  ></div>

  <div class="pane preview-pane" style="width: {100 - splitPos}%">
    <div class="pane-header">
      <span class="pane-label">Preview</span>
      <button class="btn btn-ghost btn-sm" onclick={popOut}>&nearr; Pop out</button>
    </div>
    <iframe
      title="Preview"
      srcdoc={previewSrc}
      sandbox="allow-scripts"
      class="preview-frame"
    ></iframe>
  </div>
</div>

<style>
  .vibe-container {
    display: flex;
    height: calc(100vh - 48px);
    overflow: hidden;
    margin: -24px;
    user-select: none;
  }

  .vibe-container.dragging { cursor: col-resize; }

  .pane {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex-shrink: 0;
  }

  .pane-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border);
    height: 40px;
    flex-shrink: 0;
  }

  .pane-label {
    font-size: 11px;
    font-family: 'JetBrains Mono', monospace;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .lang-select {
    width: auto;
    font-size: 12px;
    padding: 3px 24px 3px 8px;
    border-radius: 4px;
  }

  .code-editor {
    flex: 1;
    background: #0d0d0d;
    color: #e4e4e4;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    line-height: 1.6;
    padding: 16px;
    border: none;
    resize: none;
    outline: none;
    tab-size: 2;
    width: 100%;
    overflow-y: auto;
    box-shadow: none;
  }

  .code-editor:focus {
    border: none;
    box-shadow: none;
  }

  .divider-drag {
    width: 4px;
    background: var(--border);
    cursor: col-resize;
    flex-shrink: 0;
    transition: background 150ms;
    position: relative;
    z-index: 10;
  }

  .divider-drag:hover,
  .dragging .divider-drag {
    background: var(--accent);
  }

  .preview-frame {
    flex: 1;
    border: none;
    width: 100%;
    background: #fff;
  }

  @media (max-width: 768px) {
    .vibe-container { flex-direction: column; }
    .pane { width: 100% !important; height: 50vh; }
    .divider-drag { width: 100%; height: 4px; cursor: row-resize; }
  }
</style>