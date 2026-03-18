'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Bot, Wrench, Workflow, Brain, Settings, Terminal,
  Globe, ChevronRight, Zap, BookOpen, PlugZap, LogOut,
  Palette, Key, ChevronDown, Users, Plus
} from 'lucide-react';
import './globals.css';

const MODES = ['Agent', 'Website Builder', 'Code'];

const NAV = [
  { label: 'Home',        href: '/',             icon: LayoutDashboard },
  { label: 'Studio',      href: '/studio',       icon: Bot },
  { label: 'Agents',      href: '/agents',       icon: Users },
  { label: 'Tools',       href: '/tools',        icon: Wrench },
  { label: 'Workflows',   href: '/workflows',    icon: Workflow },
  { label: 'Browser',     href: '/browser',      icon: Globe },
  { label: 'Memory',      href: '/memory',       icon: Brain },
  { label: 'Terminal',    href: '/terminal',     icon: Terminal },
];

const BOTTOM_NAV = [
  { label: 'API Keys',      href: '/api',           icon: Key },
  { label: 'Integrations',  href: '/integrations',  icon: PlugZap },
  { label: 'Themes',        href: '/themes',        icon: Palette },
  { label: 'Docs',          href: '/docs',          icon: BookOpen },
  { label: 'Settings',      href: '/settings',      icon: Settings },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mode, setMode] = useState(0);
  const [showModes, setShowModes] = useState(false);

  if (pathname === '/login') {
    return (
      <html lang="en">
        <head>
          <title>Agent Swarp — Login</title>
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        </head>
        <body>{children}</body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <title>Agent Swarp — Autonomous Studio</title>
        <meta name="description" content="Open-source autonomous AI agent framework. Build, deploy, and orchestrate intelligent agents." />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="app-shell">
          {/* Sidebar */}
          <aside className="sidebar">
            {/* Brand */}
            <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 0 12px rgba(124,58,237,0.35)' }}>
                {/* Sharp Achromatic Swarm / S-Glyph icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M12 6L8 8.5V15.5L12 18L16 15.5V8.5L12 6Z" fill="#7c3aed" fillOpacity="0.8"/>
                  <circle cx="12" cy="12" r="2" fill="#ffffff"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: '-0.01em' }}>Agent Swarp</div>
                <div style={{ fontSize: 10, color: 'var(--text-subtle)' }}>Open-source · autonomous</div>
              </div>
            </div>

            {/* Mode switcher */}
            <div style={{ padding: '7px 9px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
              <button onClick={() => setShowModes(p => !p)}
                style={{ width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 6, padding: '5px 10px', color: 'var(--text-muted)', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontFamily: 'inherit' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {mode === 0 ? <Bot size={11} /> : mode === 1 ? <Globe size={11} /> : <Wrench size={11} />}
                  {MODES[mode]}
                </span>
                <ChevronDown size={11} />
              </button>
              {showModes && (
                <div style={{ position: 'absolute', left: 9, right: 9, top: '100%', marginTop: 2, background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)', borderRadius: 6, overflow: 'hidden', zIndex: 50 }}>
                  {MODES.map((m, i) => (
                    <button key={m} onClick={() => { setMode(i); setShowModes(false); }}
                      style={{ width: '100%', background: i === mode ? 'rgba(124,58,237,0.12)' : 'none', border: 'none', padding: '7px 12px', color: i === mode ? 'var(--accent-light)' : 'var(--text-muted)', fontSize: 12, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Main nav */}
            <div style={{ padding: '6px 0', flex: 1 }}>
              <div className="nav-section">Workspace</div>
              {NAV.map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href}>
                  <div className={`nav-item ${pathname === href || (href !== '/' && pathname.startsWith(href)) ? 'active' : ''}`}>
                    <Icon size={14} />
                    {label}
                    {href === '/agents' && (
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 14, height: 14, borderRadius: 3, background: 'rgba(124,58,237,0.2)' }}>
                        <Plus size={9} color="var(--accent-light)" />
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* Bottom nav */}
            <div style={{ borderTop: '1px solid var(--border)', padding: '5px 0 6px' }}>
              <div className="nav-section">Config</div>
              {BOTTOM_NAV.map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href}>
                  <div className={`nav-item ${pathname === href ? 'active' : ''}`}>
                    <Icon size={14} />
                    {label}
                  </div>
                </Link>
              ))}
              <Link href="/login">
                <div className="nav-item" style={{ marginTop: 3, color: 'var(--text-subtle)' }}>
                  <LogOut size={14} />
                  Sign out
                </div>
              </Link>
            </div>
          </aside>

          {/* Main area */}
          <div className="main-area">
            {/* Top bar */}
            <div className="top-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                <span style={{ color: 'var(--text-subtle)' }}>Agent Swarp</span>
                <ChevronRight size={11} color="var(--text-subtle)" />
                <span style={{ color: 'var(--text-muted)' }}>
                  {pathname === '/' ? 'Home' : pathname.replace('/', '').charAt(0).toUpperCase() + pathname.replace('/', '').slice(1)}
                </span>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-subtle)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 7px', fontFamily: 'monospace' }}>:{' '}9989</span>
                <span className="dot dot-green" />
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Online</span>
              </div>
            </div>

            {/* Page */}
            <div className="page-content">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
