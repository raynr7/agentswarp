'use client';
import React, { useState } from 'react';
import { 
  Workflow, Plus, Play, Pause, Trash2, ChevronRight, Zap, 
  Database, Globe, Mail, MessageSquare, Bot, Code2, MoveRight
} from 'lucide-react';

interface Node { id: string; type: string; label: string; x: number; y: number; icon: any; color: string; }
interface Edge { from: string; to: string; }

const NODE_TYPES = [
  { type: 'trigger', label: 'HTTP Trigger',  icon: Globe,         color: '#60a5fa' },
  { type: 'tool',    label: 'Web Search',   icon: Zap,           color: '#f97316' },
  { type: 'llm',     label: 'Agent Swarp',  icon: Bot,           color: '#7c3aed' },
  { type: 'output',  label: 'Send Slack',   icon: MessageSquare, color: '#4ade80' },
  { type: 'db',      label: 'Store KV',     icon: Database,      color: '#a78bfa' },
];

const INITIAL_NODES: Node[] = [
  { id: '1', type: 'trigger', label: 'HTTP Webhook', x: 50,  y: 150, icon: Globe,         color: '#60a5fa' },
  { id: '2', type: 'tool',    label: 'Brave Search', x: 250, y: 150, icon: Zap,           color: '#f97316' },
  { id: '3', type: 'llm',     label: 'Agent Loop',  x: 450, y: 150, icon: Bot,           color: '#7c3aed' },
  { id: '4', type: 'output',  label: 'Slack Notify', x: 650, y: 150, icon: MessageSquare, color: '#4ade80' },
];

const INITIAL_EDGES: Edge[] = [
  { from: '1', to: '2' }, { from: '2', to: '3' }, { from: '3', to: '4' }
];

export default function WorkflowsPage() {
  const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
  const [edges] = useState<Edge[]>(INITIAL_EDGES);
  const [dragging, setDragging] = useState<string | null>(null);

  const onDrag = (e: React.MouseEvent, id: string) => {
    if (!dragging) return;
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x: e.clientX - 350, y: e.clientY - 200 } : n));
  };

  return (
    <div style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 2 }}>
            <Workflow size={16} style={{ display: 'inline', marginRight: 8 }} />Visual Workflows
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>n8n-style visual engine for chaining agents and tools.</p>
        </div>
        <div style={{ display:'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm"><Play size={12} /> Test Run</button>
          <button className="btn btn-primary btn-sm"><Plus size={12} /> New Node</button>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', background: '#0e0e0f', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', backgroundImage: 'radial-gradient(var(--border-strong) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        
        {/* Connection lines (SVG overlay) */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {edges.map((edge, i) => {
            const from = nodes.find(n => n.id === edge.from);
            const to = nodes.find(n => n.id === edge.to);
            if (!from || !to) return null;
            return (
              <line key={i} x1={from.x + 80} y1={from.y + 40} x2={to.x + 20} y2={to.y + 40} 
                stroke="var(--border-strong)" strokeWidth="1.5" strokeDasharray="4 2" />
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map(node => (
          <div key={node.id} 
            onMouseDown={() => setDragging(node.id)}
            onMouseMove={(e) => dragging === node.id && onDrag(e, node.id)}
            onMouseUp={() => setDragging(null)}
            className="card card-hover"
            style={{ 
              position: 'absolute', left: node.x, top: node.y, width: 160, padding: '12px', cursor: dragging ? 'grabbing' : 'grab', 
              userSelect: 'none', border: '1px solid var(--border-strong)', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', 
              background: 'rgba(20,20,22,0.8)', backdropFilter: 'blur(12px)'
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <node.icon size={14} color={node.color} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600 }}>{node.label}</div>
                <div style={{ fontSize: 9, color: 'var(--text-subtle)' }}>{node.type}</div>
              </div>
            </div>
            {/* IO Ports */}
            <div style={{ position: 'absolute', left: -5, top: '45%', width: 10, height: 10, borderRadius: '50%', background: 'var(--border)', border: '2px solid #0e0e0f' }} />
            <div style={{ position: 'absolute', right: -5, top: '45%', width: 10, height: 10, borderRadius: '50%', background: node.color, border: '2px solid #0e0e0f' }} />
          </div>
        ))}

        {/* Toolbox Sidebar (floating) */}
        <div style={{ position: 'absolute', left: 20, bottom: 20, display: 'flex', gap: 8, background: 'rgba(9,9,11,0.8)', padding: '6px', borderRadius: 10, border: '1px solid var(--border-strong)', backdropFilter: 'blur(20px)' }}>
          {NODE_TYPES.map(t => (
            <button key={t.type} className="btn btn-ghost btn-sm" style={{ padding: '8px' }} title={t.label}>
              <t.icon size={13} color={t.color} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
