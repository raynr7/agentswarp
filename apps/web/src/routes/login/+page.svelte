<script lang="ts">
  import { goto } from '$app/navigation';

  // Tab state
  let activeTab = $state<'password' | 'magic'>('password');

  // Password form
  let email = $state('');
  let password = $state('');
  let rememberMe = $state(false);

  // Magic link form
  let magicEmail = $state('');
  let magicSent = $state(false);
  let otpDigits = $state<string[]>(['', '', '', '', '', '']);
  let otpRefs = $state<HTMLInputElement[]>([]);

  // UI state
  let loading = $state(false);
  let error = $state('');
  let success = $state('');

  // Derived OTP value
  let otpValue = $derived(otpDigits.join(''));

  function clearMessages() {
    error = '';
    success = '';
  }

  function switchTab(tab: 'password' | 'magic') {
    activeTab = tab;
    clearMessages();
    magicSent = false;
    otpDigits = ['', '', '', '', '', ''];
  }

  async function handlePasswordLogin(e: Event) {
    e.preventDefault();
    if (!email || !password) {
      error = 'Please fill in all fields.';
      return;
    }
    clearMessages();
    loading = true;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Login failed');
      if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
      success = 'Login successful! Redirecting...';
      setTimeout(() => goto('/'), 800);
    } catch (err: any) {
      error = err.message || 'An unexpected error occurred.';
    } finally {
      loading = false;
    }
  }

  async function handleMagicRequest(e: Event) {
    e.preventDefault();
    if (!magicEmail) {
      error = 'Please enter your email address.';
      return;
    }
    clearMessages();
    loading = true;
    try {
      const res = await fetch('/api/auth/magic-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: magicEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Request failed');
      magicSent = true;
      success = 'Check your email -- a 6-digit code is on its way!';
    } catch (err: any) {
      error = err.message || 'An unexpected error occurred.';
    } finally {
      loading = false;
    }
  }

  async function handleMagicVerify(e: Event) {
    e.preventDefault();
    if (otpValue.length < 6) {
      error = 'Please enter the full 6-digit code.';
      return;
    }
    clearMessages();
    loading = true;
    try {
      const res = await fetch('/api/auth/magic-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: magicEmail, code: otpValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Verification failed');
      if (data.accessToken) localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
      success = 'Verified! Redirecting...';
      setTimeout(() => goto('/'), 800);
    } catch (err: any) {
      error = err.message || 'An unexpected error occurred.';
    } finally {
      loading = false;
    }
  }

  function handleOtpInput(index: number, e: Event) {
    const input = e.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '');
    if (!val) {
      otpDigits[index] = '';
      return;
    }
    const char = val.slice(-1);
    otpDigits[index] = char;
    otpDigits = [...otpDigits];
    if (index < 5) {
      otpRefs[index + 1]?.focus();
    }
  }

  function handleOtpKeydown(index: number, e: KeyboardEvent) {
    if (e.key === 'Backspace') {
      if (otpDigits[index]) {
        otpDigits[index] = '';
        otpDigits = [...otpDigits];
      } else if (index > 0) {
        otpRefs[index - 1]?.focus();
        otpDigits[index - 1] = '';
        otpDigits = [...otpDigits];
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpRefs[index + 1]?.focus();
    }
  }

  function handleOtpPaste(e: ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData?.getData('text') || '';
    const digits = text.replace(/\D/g, '').slice(0, 6).split('');
    const newDigits = [...otpDigits];
    digits.forEach((d, i) => { newDigits[i] = d; });
    otpDigits = newDigits;
    const nextEmpty = newDigits.findIndex(d => !d);
    const focusIdx = nextEmpty === -1 ? 5 : nextEmpty;
    otpRefs[focusIdx]?.focus();
  }

  function setOtpRef(index: number, el: HTMLInputElement | null) {
    if (el) otpRefs[index] = el;
  }
</script>

<div class="page">
  <!-- Aurora background layers -->
  <div class="aurora">
    <div class="aurora-blob aurora-1"></div>
    <div class="aurora-blob aurora-2"></div>
    <div class="aurora-blob aurora-3"></div>
    <div class="aurora-blob aurora-4"></div>
  </div>

  <!-- Card -->
  <div class="card">
    <!-- Logo / Title -->
    <div class="brand">
      <div class="logo-wrap">
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="38" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#a78bfa"/>
              <stop offset="50%" stop-color="#38bdf8"/>
              <stop offset="100%" stop-color="#34d399"/>
            </linearGradient>
          </defs>
          <rect width="38" height="38" rx="10" fill="url(#logoGrad)" opacity="0.15"/>
          <path d="M9 27L16 11L19 19L22 14L29 27" stroke="url(#logoGrad)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="19" cy="10" r="2.5" fill="url(#logoGrad)"/>
        </svg>
      </div>
      <h1 class="brand-title">AgentSwarp</h1>
      <p class="brand-sub">Intelligent agent orchestration</p>
    </div>

    <!-- Tabs -->
    <div class="tabs" role="tablist">
      <button
        class="tab-btn {activeTab === 'password' ? 'active' : ''}"
        role="tab"
        aria-selected={activeTab === 'password'}
        onclick={() => switchTab('password')}
      >
        Email &amp; Password
      </button>
      <button
        class="tab-btn {activeTab === 'magic' ? 'active' : ''}"
        role="tab"
        aria-selected={activeTab === 'magic'}
        onclick={() => switchTab('magic')}
      >
        Magic Link
      </button>
      <div class="tab-indicator" style="transform: translateX({activeTab === 'password' ? '0%' : '100%'})"></div>
    </div>

    <!-- Tab content -->
    <div class="tab-content">
      <!-- Password Tab -->
      {#if activeTab === 'password'}
        <form class="form slide-in" onsubmit={handlePasswordLogin} novalidate>
          <div class="field">
            <label for="pw-email" class="label">Email address</label>
            <input
              id="pw-email"
              type="email"
              class="input"
              placeholder="you@example.com"
              autocomplete="email"
              bind:value={email}
              disabled={loading}
            />
          </div>
          <div class="field">
            <label for="pw-password" class="label">Password</label>
            <input
              id="pw-password"
              type="password"
              class="input"
              placeholder="â¢â¢â¢â¢â¢â¢â¢â¢"
              autocomplete="current-password"
              bind:value={password}
              disabled={loading}
            />
          </div>
          <div class="checkbox-row">
            <label class="checkbox-label">
              <input type="checkbox" bind:checked={rememberMe} disabled={loading} class="checkbox" />
              <span class="checkbox-custom"></span>
              <span class="checkbox-text">Remember me</span>
            </label>
            <a href="/forgot-password" class="forgot-link">Forgot password?</a>
          </div>

          {#if error}
            <div class="message error-msg" role="alert">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#f87171" stroke-width="1.5"/><path d="M8 5v3.5M8 11v.5" stroke="#f87171" stroke-width="1.5" stroke-linecap="round"/></svg>
              {error}
            </div>
          {/if}
          {#if success}
            <div class="message success-msg" role="status">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#34d399" stroke-width="1.5"/><path d="M5 8.5l2 2 4-4" stroke="#34d399" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              {success}
            </div>
          {/if}

          <button type="submit" class="btn-primary" disabled={loading}>
            {#if loading}
              <span class="spinner"></span>
              Signing in...
            {:else}
              Sign in
            {/if}
          </button>
        </form>
      {/if}

      <!-- Magic Link Tab -->
      {#if activeTab === 'magic'}
        <div class="form slide-in">
          {#if !magicSent}
            <form onsubmit={handleMagicRequest} novalidate>
              <p class="magic-desc">Enter your email and we'll send you a 6-digit code to sign in instantly -- no password needed.</p>
              <div class="field">
                <label for="magic-email" class="label">Email address</label>
                <input
                  id="magic-email"
                  type="email"
                  class="input"
                  placeholder="you@example.com"
                  autocomplete="email"
                  bind:value={magicEmail}
                  disabled={loading}
                />
              </div>

              {#if error}
                <div class="message error-msg" role="alert">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#f87171" stroke-width="1.5"/><path d="M8 5v3.5M8 11v.5" stroke="#f87171" stroke-width="1.5" stroke-linecap="round"/></svg>
                  {error}
                </div>
              {/if}

              <button type="submit" class="btn-primary" disabled={loading}>
                {#if loading}
                  <span class="spinner"></span>
                  Sending code...
                {:else}
                  Send magic code
                {/if}
              </button>
            </form>
          {:else}
            <form onsubmit={handleMagicVerify} novalidate>
              <div class="verify-header">
                <div class="verify-icon">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M4 8l10 7 10-7" stroke="#a78bfa" stroke-width="1.8" stroke-linecap="round"/><rect x="2" y="6" width="24" height="17" rx="3" stroke="#a78bfa" stroke-width="1.8"/></svg>
                </div>
                <p class="verify-title">Check your inbox</p>
                <p class="verify-sub">We sent a 6-digit code to <strong>{magicEmail}</strong></p>
              </div>

              <div class="otp-row" onpaste={handleOtpPaste}>
                {#each otpDigits as digit, i}
                  <input
                    type="text"
                    inputmode="numeric"
                    maxlength="1"
                    class="otp-input {digit ? 'filled' : ''}"
                    value={digit}
                    oninput={(e) => handleOtpInput(i, e)}
                    onkeydown={(e) => handleOtpKeydown(i, e)}
                    disabled={loading}
                    aria-label={`Digit ${i + 1}`}
                    bind:this={otpRefs[i]}
                  />
                {/each}
              </div>

              {#if error}
                <div class="message error-msg" role="alert">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#f87171" stroke-width="1.5"/><path d="M8 5v3.5M8 11v.5" stroke="#f87171" stroke-width="1.5" stroke-linecap="round"/></svg>
                  {error}
                </div>
              {/if}
              {#if success}
                <div class="message success-msg" role="status">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#34d399" stroke-width="1.5"/><path d="M5 8.5l2 2 4-4" stroke="#34d399" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  {success}
                </div>
              {/if}

              <button type="submit" class="btn-primary" disabled={loading || otpValue.length < 6}>
                {#if loading}
                  <span class="spinner"></span>
                  Verifying...
                {:else}
                  Verify &amp; sign in
                {/if}
              </button>

              <button
                type="button"
                class="btn-ghost"
                onclick={() => { magicSent = false; clearMessages(); }}
                disabled={loading}
              >
                <- Use a different email
              </button>
            </form>
          {/if}
        </div>
      {/if}
    </div>

    <p class="footer-note">By signing in you agree to our <a href="/terms" class="text-link">Terms</a> &amp; <a href="/privacy" class="text-link">Privacy</a>.</p>
  </div>
</div>

<style>
  /* -- Base -- */
  :global(*, *::before, *::after) {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  .page {
    min-height: 100svh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #050810;
    position: relative;
    overflow: hidden;
    font-family: 'Geist', 'Inter', system-ui, sans-serif;
    padding: 1.5rem;
  }

  /* -- Aurora -- */
  .aurora {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .aurora-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0;
    animation: auroraFloat 12s ease-in-out infinite;
  }

  .aurora-1 {
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, #7c3aed55 0%, transparent 70%);
    top: -15%;
    left: -10%;
    animation-delay: 0s;
    animation-duration: 14s;
  }

  .aurora-2 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, #0ea5e955 0%, transparent 70%);
    top: 30%;
    right: -10%;
    animation-delay: -4s;
    animation-duration: 16s;
  }

  .aurora-3 {
    width: 450px;
    height: 450px;
    background: radial-gradient(circle, #14b8a655 0%, transparent 70%);
    bottom: -10%;
    left: 20%;
    animation-delay: -8s;
    animation-duration: 18s;
  }

  .aurora-4 {
    width: 350px;
    height: 350px;
    background: radial-gradient(circle, #8b5cf640 0%, transparent 70%);
    top: 10%;
    right: 25%;
    animation-delay: -2s;
    animation-duration: 20s;
  }

  @keyframes auroraFloat {
    0%, 100% {
      opacity: 0.6;
      transform: translate(0, 0) scale(1);
    }
    33% {
      opacity: 0.8;
      transform: translate(30px, -40px) scale(1.05);
    }
    66% {
      opacity: 0.5;
      transform: translate(-20px, 30px) scale(0.97);
    }
  }

  /* -- Card -- */
  .card {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 420px;
    background: rgba(15, 18, 30, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 2.5rem 2rem 2rem;
    backdrop-filter: blur(24px) saturate(160%);
    -webkit-backdrop-filter: blur(24px) saturate(160%);
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.04) inset,
      0 8px 32px rgba(0,0,0,0.5),
      0 1px 0 rgba(255,255,255,0.06) inset;
    animation: cardIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes cardIn {
    from {
      opacity: 0;
      transform: translateY(24px) scale(0.97);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* -- Brand -- */
  .brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.75rem;
  }

  .logo-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 14px;
    background: rgba(167, 139, 250, 0.08);
    border: 1px solid rgba(167, 139, 250, 0.2);
    margin-bottom: 0.25rem;
  }

  .brand-title {
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    background: linear-gradient(135deg, #e2d9f3 0%, #a78bfa 40%, #38bdf8 80%, #34d399 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .brand-sub {
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.4);
    letter-spacing: 0.01em;
  }

  /* -- Tabs -- */
  .tabs {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    padding: 3px;
    margin-bottom: 1.75rem;
    overflow: hidden;
  }

  .tab-indicator {
    position: absolute;
    top: 3px;
    left: 3px;
    width: calc(50% - 3px);
    height: calc(100% - 6px);
    background: linear-gradient(135deg, rgba(124, 58, 237, 0.35) 0%, rgba(14, 165, 233, 0.25) 100%);
    border: 1px solid rgba(167, 139, 250, 0.3);
    border-radius: 7px;
    transition: transform 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
    pointer-events: none;
  }

  .tab-btn {
    position: relative;
    z-index: 1;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
    font-weight: 500;
    font-family: inherit;
    color: rgba(255,255,255,0.45);
    border-radius: 7px;
    transition: color 0.2s ease;
    white-space: nowrap;
  }

  .tab-btn.active {
    color: rgba(255,255,255,0.92);
  }

  .tab-btn:hover:not(.active) {
    color: rgba(255,255,255,0.65);
  }

  /* -- Tab content -- */
  .tab-content {
    min-height: 260px;
  }

  .slide-in {
    animation: slideIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* -- Form -- */
  .form {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    margin-bottom: 1rem;
  }

  .label {
    font-size: 0.8rem;
    font-weight: 500;
    color: rgba(255,255,255,0.6);
    letter-spacing: 0.01em;
  }

  .input {
    width: 100%;
    padding: 0.625rem 0.875rem;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 9px;
    color: rgba(255,255,255,0.92);
    font-size: 0.9rem;
    font-family: inherit;
    outline: none;
    transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
    -webkit-appearance: none;
  }

  .input::placeholder {
    color: rgba(255,255,255,0.22);
  }

  .input:focus {
    border-color: rgba(167, 139, 250, 0.6);
    background: rgba(255,255,255,0.07);
    box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.12);
  }

  .input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* -- Checkbox row -- */
  .checkbox-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.25rem;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    user-select: none;
  }

  .checkbox {
    display: none;
  }

  .checkbox-custom {
    width: 16px;
    height: 16px;
    border: 1.5px solid rgba(255,255,255,0.2);
    border-radius: 4px;
    background: rgba(255,255,255,0.04);
    flex-shrink: 0;
    position: relative;
    transition: border-color 0.2s, background 0.2s;
  }

  .checkbox:checked + .checkbox-custom {
    background: linear-gradient(135deg, #7c3aed, #0ea5e9);
    border-color: transparent;
  }

  .checkbox:checked + .checkbox-custom::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 4px;
    width: 5px;
    height: 8px;
    border-right: 2px solid #fff;
    border-bottom: 2px solid #fff;
    transform: rotate(45deg);
  }

  .checkbox-text {
    font-size: 0.8125rem;
    color: rgba(255,255,255,0.55);
  }

  .forgot-link {
    font-size: 0.8rem;
    color: rgba(167, 139, 250, 0.8);
    text-decoration: none;
    transition: color 0.2s;
  }

  .forgot-link:hover {
    color: #a78bfa;
  }

  /* -- Messages -- */
  .message {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 0.75rem;
    border-radius: 8px;
    font-size: 0.8125rem;
    line-height: 1.4;
    margin-bottom: 1rem;
    animation: msgIn 0.25s ease both;
  }

  @keyframes msgIn {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .error-msg {
    background: rgba(248, 113, 113, 0.1);
    border: 1px solid rgba(248, 113, 113, 0.25);
    color: #fca5a5;
  }

  .success-msg {
    background: rgba(52, 211, 153, 0.1);
    border: 1px solid rgba(52, 211, 153, 0.25);
    color: #6ee7b7;
  }

  /* -- Buttons -- */
  .btn-primary {
    width: 100%;
    padding: 0.7rem 1.25rem;
    background: linear-gradient(135deg, #7c3aed 0%, #2563eb 50%, #0ea5e9 100%);
    color: #fff;
    border: none;
    border-radius: 9px;
    font-size: 0.9rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 4px 16px rgba(124, 58, 237, 0.3);
    position: relative;
    overflow: hidden;
    letter-spacing: 0.01em;
  }

  .btn-primary::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%);
    pointer-events: none;
  }

  .btn-primary:hover:not(:disabled) {
    opacity: 0.92;
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(124, 58, 237, 0.4);
  }

  .btn-primary:active:not(:disabled) {
    transform: translateY(0);
  }

  .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .btn-ghost {
    width: 100%;
    padding: 0.6rem;
    background: transparent;
    color: rgba(255,255,255,0.4);
    border: none;
    border-radius: 8px;
    font-size: 0.8125rem;
    font-family: inherit;
    cursor: pointer;
    margin-top: 0.5rem;
    transition: color 0.2s, background 0.2s;
  }

  .btn-ghost:hover:not(:disabled) {
    color: rgba(255,255,255,0.7);
    background: rgba(255,255,255,0.04);
  }

  .btn-ghost:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* -- Spinner -- */
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.65s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* -- Magic desc -- */
  .magic-desc {
    font-size: 0.8125rem;
    color: rgba(255,255,255,0.45);
    line-height: 1.55;
    margin-bottom: 1.25rem;
  }

  /* -- Verify header -- */
  .verify-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.375rem;
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .verify-icon {
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(167, 139, 250, 0.08);
    border: 1px solid rgba(167, 139, 250, 0.2);
    border-radius: 13px;
    margin-bottom: 0.25rem;
  }

  .verify-title {
    font-size: 1rem;
    font-weight: 600;
    color: rgba(255,255,255,0.88);
  }

  .verify-sub {
    font-size: 0.8125rem;
    color: rgba(255,255,255,0.45);
    line-height: 1.5;
  }

  .verify-sub strong {
    color: rgba(255,255,255,0.7);
    font-weight: 500;
  }

  /* -- OTP -- */
  .otp-row {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    margin-bottom: 1.25rem;
  }

  .otp-input {
    width: 46px;
    height: 52px;
    text-align: center;
    font-size: 1.2rem;
    font-weight: 600;
    font-family: inherit;
    background: rgba(255,255,255,0.05);
    border: 1.5px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: rgba(255,255,255,0.92);
    outline: none;
    caret-color: #a78bfa;
    transition: border-color 0.2s, background 0.2s, box-shadow 0.2s, transform 0.15s;
    -webkit-appearance: none;
  }

  .otp-input:focus {
    border-color: rgba(167, 139, 250, 0.7);
    background: rgba(255,255,255,0.07);
    box-shadow: 0 0 0 3px rgba(167, 139, 250, 0.15);
    transform: translateY(-1px);
  }

  .otp-input.filled {
    border-color: rgba(167, 139, 250, 0.45);
    background: rgba(167, 139, 250, 0.08);
  }

  .otp-input:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  /* -- Footer -- */
  .footer-note {
    margin-top: 1.5rem;
    text-align: center;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.28);
    line-height: 1.6;
  }

  .text-link {
    color: rgba(167, 139, 250, 0.7);
    text-decoration: none;
    transition: color 0.2s;
  }

  .text-link:hover {
    color: #a78bfa;
  }

  /* -- Responsive -- */
  @media (max-width: 480px) {
    .card {
      padding: 2rem 1.25rem 1.5rem;
    }

    .otp-input {
      width: 40px;
      height: 46px;
      font-size: 1.1rem;
    }

    .otp-row {
      gap: 0.375rem;
    }
  }

  @media (max-width: 360px) {
    .otp-input {
      width: 34px;
      height: 42px;
      font-size: 1rem;
      border-radius: 8px;
    }

    .otp-row {
      gap: 0.25rem;
    }
  }
</style>
