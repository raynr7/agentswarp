'use client';
import React, { useState } from 'react';
import { Settings, Save, Eye, EyeOff } from 'lucide-react';

const SECTIONS = [
  { key:'general', label:'General' },
  { key:'api', label:'API Keys' },
  { key:'persona', label:'Persona' },
  { key:'memory', label:'Memory' },
  { key:'security', label:'Security' },
];

export default function SettingsPage() {
  const [section, setSection] = useState('general');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(()=>setSaved(false), 2000); };

  return (
    <div style={{ maxWidth: 800, display:'flex', gap: 24 }}>
      {/* Left nav */}
      <div style={{ width: 160, flexShrink:0 }}>
        <div style={{ fontSize:12, fontWeight:600, color:'var(--text-subtle)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom: 8 }}>Settings</div>
        {SECTIONS.map(s => (
          <button key={s.key} onClick={() => setSection(s.key)}
            className={`nav-item ${section===s.key?'active':''}`}
            style={{ width:'100%', background:'none', border:'none', cursor:'pointer', justifyContent:'flex-start' }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Right panel */}
      <div style={{ flex:1 }}>
        {section === 'general' && (
          <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
            <h2 style={{ fontSize:16, fontWeight:600 }}>General</h2>
            <div className="card" style={{ display:'flex', flexDirection:'column', gap: 14 }}>
              <div className="input-group"><label className="label">Workspace Name</label><input defaultValue="AgentSwarp Studio" /></div>
              <div className="input-group"><label className="label">Agent Tick Interval (seconds)</label><input type="number" defaultValue={20} /></div>
              <div className="input-group"><label className="label">Default Persona</label>
                <select className="w-full bg-black border border-white/10 rounded px-2 py-1 text-xs">
                  <option>Precise</option><option>Builder</option><option>Analyst</option><option>Creative</option>
                </select>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                <input type="checkbox" id="autoretry" defaultChecked style={{ width:16, height:16 }} />
                <label htmlFor="autoretry" style={{ fontSize:13 }}>Auto-retry failed tasks</label>
              </div>
            </div>
          </div>
        )}

        {section === 'api' && (
          <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
            <h2 style={{ fontSize:16, fontWeight:600 }}>API Keys</h2>
            <div className="card" style={{ display:'flex', flexDirection:'column', gap: 14 }}>
              {['OpenAI', 'Anthropic', 'Google Gemini', 'Groq', 'GitHub', 'Slack', 'Notion'].map(k => (
                <div key={k} className="input-group">
                  <label className="label">{k} API Key</label>
                  <div style={{ position:'relative' }}>
                    <input type={showKey?'text':'password'} placeholder={`Enter ${k} key…`} style={{ paddingRight: 36 }} />
                    <button type="button" onClick={()=>setShowKey(p=>!p)}
                      style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text-subtle)' }}>
                      {showKey ? <EyeOff size={13}/> : <Eye size={13}/>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'memory' && (
          <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
            <h2 style={{ fontSize:16, fontWeight:600 }}>Memory</h2>
            <div className="card" style={{ display:'flex', flexDirection:'column', gap: 14 }}>
              <div className="input-group"><label className="label">Short-term buffer size (messages)</label><input type="number" defaultValue={20} /></div>
              <div className="input-group"><label className="label">Vector similarity threshold</label><input type="number" defaultValue={0.7} step={0.05} /></div>
              <div className="input-group"><label className="label">PostgreSQL URL</label><input type="password" placeholder="postgresql://user:pass@localhost/agentswarp" /></div>
              <div className="input-group"><label className="label">Redis URL</label><input type="password" placeholder="redis://localhost:6379" /></div>
            </div>
          </div>
        )}

        {(section === 'persona' || section === 'security') && (
          <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
            <h2 style={{ fontSize:16, fontWeight:600, textTransform:'capitalize' }}>{section}</h2>
            <div className="card" style={{ padding:'40px 20px', textAlign:'center', color:'var(--text-subtle)' }}>
              <Settings size={24} style={{ margin:'0 auto 10px', display:'block', opacity:0.3 }} />
              <div style={{ fontSize:13 }}>{section.charAt(0).toUpperCase()+section.slice(1)} settings — coming in next update</div>
            </div>
          </div>
        )}

        <button className="btn btn-primary" onClick={save} style={{ marginTop: 16 }}>
          <Save size={13} /> {saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
