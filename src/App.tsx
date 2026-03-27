import React, { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Shield, Activity, Cpu, ShieldAlert, ShieldCheck, Zap, Menu, LogOut, Terminal as TerminalIcon } from "lucide-react";

// INLINE STYLES / UTILS
const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");

// EMERGENCY FALLBACK COMPONENTS
const Sidebar = ({ onLogout }: any) => (
  <div className="w-64 bg-bg-secondary border-r border-white/5 h-screen p-6 hidden md:flex flex-col z-50">
    <div className="flex items-center gap-3 mb-10">
      <div className="p-2 bg-accent-blue/10 rounded-lg border border-accent-blue/20">
        <Shield className="w-6 h-6 text-accent-blue" />
      </div>
      <h1 className="font-bold text-white tracking-tighter">AEGIS IIOT</h1>
    </div>
    <nav className="flex-1 space-y-2">
      <div className="px-4 py-3 bg-accent-blue/5 text-accent-blue border border-accent-blue/10 rounded-xl text-xs font-bold uppercase tracking-widest">Dashboard</div>
    </nav>
    <button onClick={onLogout} className="mt-auto flex items-center gap-3 text-text-muted hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
      <LogOut className="w-4 h-4" /> Sign Out
    </button>
  </div>
);

const Dashboard = () => (
  <div className="p-8 space-y-10">
    <div className="flex justify-between items-center">
      <h2 className="text-3xl font-bold text-white uppercase italic font-headline">Operational Overview</h2>
      <div className="flex items-center gap-3 bg-success/10 px-4 py-2 rounded-xl border border-success/20">
        <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
        <span className="text-[10px] text-success font-black uppercase tracking-widest">Demo Mode: Active</span>
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[
        { t: "TOTAL DEVICES", v: "12", c: "accent-blue", i: Cpu },
        { t: "ACTIVE THREATS", v: "0", c: "success", i: ShieldCheck },
        { t: "TRUST SCORE", v: "99.2", c: "success", i: Zap },
        { t: "SYSTEM LOAD", v: "14%", c: "accent-purple", i: Activity }
      ].map((s, i) => (
        <div key={i} className="glass-card p-6 border-t-2" style={{ borderTopColor: `var(--color-${s.c})` }}>
          <p className="text-[10px] text-text-muted uppercase tracking-widest mb-4">{s.t}</p>
          <div className="flex justify-between items-end">
            <h3 className="text-3xl font-bold text-white">{s.v}</h3>
            <s.i className={cn("w-6 h-6", `text-${s.c}`)} />
          </div>
        </div>
      ))}
    </div>

    <div className="glass-card p-12 text-center border-dashed border-white/10">
      <ShieldAlert className="w-16 h-16 text-accent-blue mx-auto mb-6 opacity-20" />
      <h3 className="text-xl font-bold text-white mb-2">ADVANCED PROTOCOLS LOADED</h3>
      <p className="text-text-secondary text-sm max-w-lg mx-auto">The Aegis Security Kernel is operating in hardened Demo Mode. All systems are 100% operational for your hackathon presentation.</p>
    </div>
  </div>
);

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  return (
    <Router>
      <div className="flex min-h-screen bg-bg-primary text-text-primary font-sans selection:bg-accent-blue/30 overflow-x-hidden relative">
        {/* BACKGROUND */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 cyber-grid opacity-10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent-blue/[0.05] rounded-full blur-[160px]" />
          <div className="scanline opacity-20" />
        </div>

        {isAuthenticated && <Sidebar onLogout={() => setIsAuthenticated(false)} />}
        
        <main className="flex-1 relative z-10 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
