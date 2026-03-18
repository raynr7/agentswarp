'use client';
import React, { useState } from 'react';
import { Brain, Search, Trash2, Database, ChevronRight } from 'lucide-react';

const DEMO_MEM = [
  { id: '1', tier: 'short', key:'last_goal',     val:'Find competitor pricing',   ts: Date.now()-60000  },
  { id: '2', tier: 'long',  key:'user.name',     val:'Admin',                      ts: Date.now()-900000 },
  { id: '3', tier: 'long',  key:'user.persona',  val:'Agent Swarp',             ts: Date.now()-900000 },
  { id: '4', tier: 'vector',key:'doc:001',        val:'AgentSwarp documentation…', ts: Date.now()-3600000},
];

const TIER_BADGE: Record<string, React.CSSProperties> = {
  short:  { background:'var(--amber-dim)',  color:'var(--amber)' },
  long:   { background:'var(--cyan-dim)',   color:'var(--cyan)'  },
  vector: { background:'var(--accent-glow)',color:'var(--accent-light)' },
};

export default function MemoryPage() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'all'|'short'|'long'|'vector'>('all');
  const [mem, setMem] = useState(DEMO_MEM);

  const filtered = mem.filter(m =>
    (tab === 'all' || m.tier === tab) &&
    (m.key.includes(query) || m.val.includes(query))
  );

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
          <Brain size={18} style={{ display:'inline', marginRight: 8 }} />Memory
        </h1>
        <p style={{ color:'var(--text-muted)', fontSize: 13 }}>
          3-tier: Short-term (session) · Long-term KV (persistent) · Vector (semantic search)
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
        {[['Short-term','1 entry','session ring buffer'],
          ['Long-term KV','2 entries','persisted across runs'],
          ['Vector Store','1 entry','pgvector semantic index']].map(([t,c,d])=>(
          <div key={t} className="card" style={{ padding:'12px 14px' }}>
            <div style={{ fontSize:16, fontWeight:700, fontFamily:'monospace' }}>{c}</div>
            <div style={{ fontSize:12, fontWeight:500, marginTop:2 }}>{t}</div>
            <div style={{ fontSize:11, color:'var(--text-subtle)', marginTop:1 }}>{d}</div>
          </div>
        ))}
      </div>

      {/* Search + tabs */}
      <div style={{ display:'flex', alignItems:'center', gap: 10, marginBottom: 12 }}>
        <div style={{ position:'relative', flex:1 }}>
          <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-subtle)' }} />
          <input value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="Search memory keys…" style={{ paddingLeft:30 }} />
        </div>
      </div>
      <div className="tab-bar" style={{ marginBottom: 14 }}>
        {(['all','short','long','vector'] as const).map(t=>(
          <button key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>
            {t === 'all' ? 'All' : t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow:'hidden' }}>
        <table className="table">
          <thead>
            <tr><th>Key</th><th>Tier</th><th>Value</th><th>Age</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign:'center', color:'var(--text-subtle)', padding:24 }}>
                <Database size={20} style={{ margin:'0 auto 8px', display:'block', opacity:0.3 }} />
                No memories found
              </td></tr>
            ) : filtered.map(m => (
              <tr key={m.id}>
                <td style={{ fontFamily:'monospace', fontSize:12 }}>{m.key}</td>
                <td>
                  <span className="badge" style={{ ...TIER_BADGE[m.tier], fontSize:10 }}>{m.tier}</span>
                </td>
                <td style={{ fontSize:12, color:'var(--text-muted)', maxWidth:280, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {m.val}
                </td>
                <td style={{ fontSize:11, color:'var(--text-subtle)', whiteSpace:'nowrap' }}>
                  {Math.round((Date.now()-m.ts)/60000)}m ago
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={()=>setMem(p=>p.filter(x=>x.id!==m.id))}>
                    <Trash2 size={12} color="var(--red)" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
