'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { api, type AgentCreate } from '@/lib/api';
import { BrainCircuit, Zap, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

// ── Skill Catalogue ─────────────────────────────────────────────────────────
const SKILLS = [
  { id: 'web_search',  icon: '🔍', label: 'Web Search',     desc: 'Searches the live web for fresh data.' },
  { id: 'code_gen',    icon: '💻', label: 'Code Generation', desc: 'Writes, debugs, and refactors code.' },
  { id: 'file_rw',     icon: '📁', label: 'File System',     desc: 'Reads and writes files in the workspace.' },
  { id: 'memory',      icon: '🧠', label: '3-Tier Memory',   desc: 'Persists short, long, and vector memory.' },
  { id: 'browser',     icon: '🌐', label: 'Browser Control', desc: 'Controls a real browser for automation.' },
  { id: 'email',       icon: '📧', label: 'Email / Calendar', desc: 'Send emails and manage calendar events.' },
  { id: 'api_calls',   icon: '⚡', label: 'API Executor',    desc: 'Calls any external REST API on your behalf.' },
  { id: 'voice',       icon: '🎙️', label: 'Voice I/O',       desc: 'Speaks and listens via STT / TTS.' },
  { id: 'sub_agents',  icon: '🤖', label: 'Sub-Agents',      desc: 'Spawns child agents for parallel tasks.' },
  { id: 'design_eng',  icon: '🎨', label: 'Design Engineer', desc: 'Zero-shot UI/UX generation and iteration.' },
];

const PERSONAS = [
  { key: 'precise',  label: '🤖 Precise',   desc: 'Concise, autonomous, efficient.' },
  { key: 'builder',  label: '🚀 Builder',   desc: 'First-principles, ship fast.' },
  { key: 'analyst',  label: '📊 Analyst',   desc: 'Data-driven, thorough reasoning.' },
  { key: 'creative', label: '🎨 Creative',  desc: 'Exploratory, open-ended thinking.' },
];

export default function DeployAgentPage() {
  const router = useRouter();
  const [name, setName]               = useState('');
  const [goal, setGoal]               = useState('');
  const [personality, setPersonality] = useState('default');
  const [skills, setSkills]           = useState<string[]>(['web_search', 'memory']);
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState('');
  const [error, setError]             = useState('');

  const toggleSkill = (id: string) =>
    setSkills(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const deploy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const cfg: AgentCreate = { name, goal, personality };
      const res = await api.agents.deploy(cfg);
      setSuccess(`Agent deployed! ID: ${res.agent_id}`);
      setTimeout(() => router.push('/'), 2000);
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Deploy failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060608] text-white p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.push('/')} className="p-2 rounded-xl glass-button">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-cyan-400" />
          <span className="text-sm text-white/50">/ Deploy Agent</span>
        </div>
      </div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-light mb-1"
      >
        Deploy New Agent
      </motion.h1>
      <p className="text-white/40 text-sm mb-8">Configure and launch an autonomous background worker.</p>

      <form onSubmit={deploy} className="space-y-8">

        {/* Identity */}
        <section className="glass-panel rounded-2xl p-6 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40">Identity</h2>
          <div className="space-y-2">
            <label className="text-xs text-white/50">Agent Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              placeholder="e.g. ResearchBot-7"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition-all text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-white/50">Prime Directive (Goal)</label>
            <textarea value={goal} onChange={e => setGoal(e.target.value)} required rows={3}
              placeholder="e.g. Monitor competitor pricing and send weekly digest to Slack."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-cyan-500/50 transition-all text-sm resize-none" />
          </div>
        </section>

        {/* Personality */}
        <section className="glass-panel rounded-2xl p-6 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40">Personality Engine</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PERSONAS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPersonality(p.key)}
                className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                  personality === p.key ? 'bg-purple-600/20 border-purple-500 shadow-[0_0_15px_rgba(147,51,234,0.3)]' : 'bg-black/40 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="text-xl mb-1">{p.label.split(' ')[0]}</div>
                <div className="text-[10px] font-bold text-white uppercase tracking-wider">{p.label.split(' ').slice(1).join(' ') || p.label}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Skill Selection */}
        <section className="glass-panel rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40">Skill Loadout</h2>
            <span className="text-xs text-cyan-400 font-mono">{skills.length} active</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {SKILLS.map(sk => {
              const isActive = skills.includes(sk.id);
              return (
                <button key={sk.id} type="button" onClick={() => toggleSkill(sk.id)}
                  className={`relative text-left p-4 rounded-xl border transition-all group ${isActive ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                >
                  {isActive && <CheckCircle2 className="absolute top-3 right-3 w-4 h-4 text-indigo-400" />}
                  <span className="text-xl">{sk.icon}</span>
                  <div className="font-medium text-sm mt-2">{sk.label}</div>
                  <div className="text-xs text-white/40 mt-0.5">{sk.desc}</div>
                </button>
              );
            })}
          </div>
        </section>

        {error && <p className="text-rose-400 text-sm">{error}</p>}
        {success && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle2 className="w-4 h-4" /> {success}
          </motion.div>
        )}

        <button type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 shadow-[0_0_40px_rgba(99,102,241,0.3)]">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <><Zap className="w-5 h-5" /> Deploy & Activate</>
          )}
        </button>
      </form>
    </div>
  );
}
