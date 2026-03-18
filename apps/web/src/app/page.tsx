'use client';
import React from 'react';
import Link from 'next/link';
import { 
  Bot, Wrench, Globe, Workflow, Zap, ArrowRight, Sparkles, 
  Layers, MessageSquare, Terminal as TerminalIcon, ShieldCheck
} from 'lucide-react';

const QUICK_ACTIONS = [
  { 
    title: 'Autonomous Studio', 
    desc: 'Enter the generative loop environment for complex task execution.', 
    href: '/studio', 
    icon: Bot, 
    color: '#7c3aed' 
  },
  { 
    title: 'Agent Swarm', 
    desc: 'Spawn and orchestrate multiple sub-agents in parallel.', 
    href: '/agents', 
    icon: Layers, 
    color: '#a78bfa' 
  },
  { 
    title: 'Visual Workflows', 
    desc: 'Chain tools into automated pipelines with a node-based canvas.', 
    href: '/workflows', 
    icon: Workflow, 
    color: '#34d399' 
  },
  { 
    title: 'Browser Automation', 
    desc: 'Run Playwright-powered web automation tasks autonomously.', 
    href: '/browser', 
    icon: Globe, 
    color: '#60a5fa' 
  },
];

export default function HomePage() {
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '20px 0 60px' }}>
      {/* Hero Section */}
      <section className="fade-up" style={{ textAlign: 'center', marginBottom: 60, marginTop: 20 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 99, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: 'var(--accent-light)', fontSize: 12, fontWeight: 500, marginBottom: 20 }}>
          <Sparkles size={12} />
          Agent Swarp v4.2 · The Professional Autonomous Engine
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 20, background: 'linear-gradient(to bottom, #fff 40%, rgba(255,255,255,0.6))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          One Engine.<br />Infinite Autonomy.
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.6 }}>
          Build, orchestrate, and deploy professional AI agents with 3-tier memory, 
          built-in tools, and self-healing agentic loops. Open-source by design.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/studio">
            <button className="btn btn-primary" style={{ padding: '12px 28px', fontSize: 15 }}>
              Enter Studio <ArrowRight size={16} />
            </button>
          </Link>
          <Link href="/docs">
            <button className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: 15 }}>
              Read Docs
            </button>
          </Link>
        </div>
      </section>

      {/* Quick Entry Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 60 }}>
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.href} href={action.href}>
            <div className="card card-hover" style={{ height: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <action.icon size={20} color={action.color} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {action.title}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {action.desc}
                </p>
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: action.color, fontWeight: 500 }}>
                Launch <ArrowRight size={12} />
              </div>
              {/* Subtle background glow */}
              <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, background: action.color, filter: 'blur(50px)', opacity: 0.1, pointerEvents: 'none' }} />
            </div>
          </Link>
        ))}
      </div>

      {/* System Status / Stats Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={14} color="var(--amber)" /> Engine Status
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>104</div>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>Tools Ready</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>:6969</div>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>Active Port</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color: 'var(--green)' }}>Stable</div>
              <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>Uptime</div>
            </div>
          </div>
          <div style={{ marginTop: 20, fontSize: 12, color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={12} color="var(--green)" /> No API Key required for basic mode · Fallback active
          </div>
        </div>

        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>Active Sessions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <MessageSquare size={12} /> Default Session 
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-subtle)' }}>Just now</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px', opacity: 0.5, fontSize: 12, color: 'var(--text-muted)' }}>
              <TerminalIcon size={12} /> Terminal Shell
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-subtle)' }}>Idle</span>
            </div>
          </div>
          <Link href="/studio">
            <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 8 }}>Open All Sessions</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
