'use client';

import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { BrainCircuit, Activity, Network, Code2, Zap, Settings, Command } from 'lucide-react';
import Lenis from '@studio-freight/lenis';
import SwarmVisualizer from '../components/visualizer/SwarmVisualizer';

export default function Dashboard() {
  const controls = useAnimation();

  useEffect(() => {
    // Smooth scroll setup (Lenis) - The Apple/Linear scroll feel
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    controls.start(i => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }));

    return () => lenis.destroy();
  }, [controls]);

  return (
    <div className="flex w-full h-full p-4 gap-4">
      
      {/* Sleek Twin-Style Sidebar */}
      <motion.aside 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-64 glass-panel rounded-3xl flex flex-col justify-between overflow-hidden relative"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
        
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-white/90">AgentSwarp</h1>
          </div>

          <nav className="flex flex-col gap-2 relative z-10">
            {[
              { icon: Activity, label: 'Overview', active: true },
              { icon: Network, label: 'Swarm Graph', active: false },
              { icon: Code2, label: 'Design Engineer', active: false },
              { icon: Zap, label: 'Automations', active: false },
              { icon: Settings, label: 'Configuration', active: false }
            ].map((item, i) => (
              <button 
                key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group
                  ${item.active ? 'bg-white/10 text-white shadow-inner' : 'text-white/50 hover:bg-white/5 hover:text-white/90'}`}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5" />
                  {item.active && <div className="absolute inset-0 bg-cyan-400 blur-md opacity-40 mix-blend-screen" />}
                </div>
                <span className="font-medium text-sm tracking-wide">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-white/5 mx-2 mb-2">
          <button className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-[#111116] border border-white/5 hover:bg-[#1a1a24] transition-colors group">
            <div className="flex items-center gap-3">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="User" className="w-8 h-8 rounded-full bg-white/10" />
              <div className="text-left">
                <p className="text-[13px] font-semibold text-white/90">GravityClaw Engine</p>
                <p className="text-[11px] text-white/40 group-hover:text-cyan-400 transition-colors">Admin Session</p>
              </div>
            </div>
          </button>
        </div>
      </motion.aside>

      {/* Main Canvas / Dashboard Area */}
      <main className="flex-1 rounded-3xl overflow-hidden relative flex flex-col">
        {/* Top Floating Command Bar */}
        <header className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-4 bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-full px-5 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
            <h2 className="text-sm font-semibold tracking-widest text-white/80 uppercase">Command Center</h2>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Swarm Autonomous
            </div>
          </div>
          
          <button className="pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/50 hover:text-white/90 hover:bg-white/10 transition-all">
            <Command className="w-4 h-4" />
            <span className="text-xs font-mono">⌘ K</span>
          </button>
        </header>

        {/* Bento Grid Content */}
        <div className="flex-1 overflow-y-auto pt-24 pb-8 px-4 sm:px-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Active Agents', value: '12', glow: 'from-cyan-500/20 to-transparent' },
                { title: 'Tasks Orchestrated', value: '4,892', glow: 'from-indigo-500/20 to-transparent' },
                { title: 'Engine Uptime', value: '99.9%', glow: 'from-emerald-500/20 to-transparent' }
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  custom={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={controls}
                  className="glass-panel p-6 rounded-3xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500 ease-out"
                >
                  <div className={`absolute -inset-x-0 -top-10 h-32 bg-gradient-to-b ${stat.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl`} />
                  <p className="text-sm font-medium text-white/50 tracking-wider uppercase mb-2">{stat.title}</p>
                  <p className="text-4xl font-light tracking-tight text-white/95">{stat.value}</p>
                </motion.div>
              ))}
            </div>

            <motion.div 
              custom={4}
              initial={{ opacity: 0, y: 30 }}
              animate={controls}
              className="w-full h-96 rounded-3xl relative overflow-hidden group"
            >
               <SwarmVisualizer />
            </motion.div>

          </div>
        </div>
      </main>

    </div>
  );
}
