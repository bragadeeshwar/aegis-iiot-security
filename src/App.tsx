import React, { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line 
} from "recharts";
import { 
  Shield, Activity, Cpu, ShieldAlert, ShieldCheck, Zap, Menu, LogOut, Terminal as TerminalIcon,
  ArrowUpRight, ArrowDownRight, Network, Brain, Settings as SettingsIcon, LayoutDashboard, ShieldCheck as ZeroTrustIcon, FileText, Zap as SimulationIcon
} from "lucide-react";

// --- UTILITIES & MOCK DATA ---
const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");

const initialDevices = [
  { id: 1, name: "PLC-01 Primary", ip: "192.168.1.10", status: "online", type: "PLC", health: 98 },
  { id: 2, name: "HMI-Industrial", ip: "192.168.1.15", status: "online", type: "HMI", health: 95 },
  { id: 3, name: "Motor Controller", ip: "192.168.1.22", status: "online", type: "Sensor", health: 88 },
  { id: 4, name: "Gateway-Edge", ip: "192.168.1.1", status: "online", type: "Gateway", health: 99 },
];

const initialThreats = [
  { id: 1, name: "SYN Flood Attempt", severity: "high", status: "active", timestamp: "10:15:22" },
  { id: 2, name: "Unauthorized Access", severity: "critical", status: "mitigated", timestamp: "09:44:10" },
];

// --- SUB-COMPONENTS ---

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, isIsolated }: any) => (
  <motion.div 
    className={cn(
      "glass-card p-4 md:p-6 relative overflow-hidden group border-t-2 transition-all duration-500",
      isIsolated && "border-danger bg-danger/5 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-pulse"
    )}
    style={{ borderTopColor: isIsolated ? "#EF4444" : color === "blue" ? "#00fbfb" : color === "red" ? "#ffb4ab" : color === "green" ? "#00dddd" : "#ffaaf7" }}
  >
    <div className="flex justify-between items-start mb-3 relative z-10">
      <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.2em]">{title}</p>
      {!isIsolated && (
        <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[9px] font-bold", trend === "up" ? "bg-success/10 text-success" : "bg-danger/10 text-danger")}>
          {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trendValue}
        </div>
      )}
    </div>
    <div className="flex items-end justify-between relative z-10">
      <h4 className={cn("text-2xl font-bold tracking-tighter uppercase", isIsolated ? "text-danger" : "text-white")}>
        {isIsolated ? "SHUTDOWN" : value}
      </h4>
      <div className={cn("p-2 rounded-lg bg-white/5 border border-white/10", isIsolated ? "text-danger animate-bounce" : "text-accent-blue")}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
  </motion.div>
);

const Sidebar = ({ onLogout, isOpen, onClose }: any) => {
  const location = useLocation();
  const menuItems = [
    { name: "Project overview", icon: LayoutDashboard, path: "/" },
    { name: "Device inventory", icon: Cpu, path: "/devices" },
    { name: "Network topology", icon: Network, path: "/network" },
    { name: "Threat center", icon: ShieldAlert, path: "/threats" },
    { name: "Attack simulation", icon: SimulationIcon, path: "/simulation" },
    { name: "Zero trust monitor", icon: ZeroTrustIcon, path: "/zero-trust" },
    { name: "Security reports", icon: FileText, path: "/reports" },
  ];

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={onClose} />}
      <aside className={cn(
        "fixed md:relative w-72 h-screen bg-bg-secondary/80 backdrop-blur-xl border-r border-white/5 p-6 flex flex-col z-50 transition-transform duration-500",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex items-center gap-3 mb-10 group cursor-pointer">
          <div className="p-2 bg-accent-blue/10 rounded-xl border border-accent-blue/20 group-hover:rotate-12 transition-transform">
            <Shield className="w-6 h-6 text-accent-blue" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tighter">AEGIS IIOT</h1>
            <p className="text-[8px] text-text-muted uppercase tracking-[0.4em] font-black">Security Kernel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                location.pathname === item.path ? "bg-accent-blue/10 text-accent-blue border border-accent-blue/20" : "text-text-muted hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </button>
          ))}
        </nav>

        <button onClick={onLogout} className="mt-auto flex items-center gap-4 px-4 py-4 text-text-muted hover:text-danger interface-btn-danger">
          <LogOut className="w-4 h-4" /> SIGN OUT
        </button>
      </aside>
    </>
  );
};

const Dashboard = () => {
  const [chartData] = useState([
    { name: "00:00", threats: 2, traffic: 400 },
    { name: "04:00", threats: 1, traffic: 300 },
    { name: "08:00", threats: 5, traffic: 800 },
    { name: "12:00", threats: 3, traffic: 600 },
    { name: "16:00", threats: 8, traffic: 1200 },
    { name: "20:00", threats: 4, traffic: 900 },
  ]);

  return (
    <div className="space-y-10 pb-10">
      <div className="flex justify-between items-center bg-white/[0.02] p-6 rounded-2xl border border-white/5">
         <div>
            <h2 className="text-3xl font-bold text-white font-headline uppercase italic">Operational Overview</h2>
            <p className="text-[10px] text-text-muted uppercase tracking-[0.3em] font-black">Node 01: Secure Industrial Environment</p>
         </div>
         <div className="flex items-center gap-3 bg-success/10 px-4 py-2 rounded-xl border border-success/20 animate-pulse">
            <div className="w-2 h-2 bg-success rounded-full" />
            <span className="text-[9px] text-success font-black uppercase tracking-widest">Demo Mode: Active</span>
         </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Devices" value="12" icon={Cpu} trend="up" trendValue="+2%" color="blue" />
        <StatCard title="Active Threats" value="0" icon={ShieldAlert} trend="down" trendValue="-100%" color="red" />
        <StatCard title="Trust Score" value="99.2" icon={ShieldCheck} trend="up" trendValue="+0.4%" color="green" />
        <StatCard title="System Load" value="14%" icon={Activity} trend="down" trendValue="-2%" color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg:col-span-7 glass-card p-6">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Network Traffic & Threats</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent-blue rounded-full" />
                <span className="text-[9px] text-text-muted uppercase font-bold tracking-widest">Traffic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-danger rounded-full" />
                <span className="text-[9px] text-text-muted uppercase font-bold tracking-widest">Threats</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00fbfb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00fbfb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#ffffff20" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0f1629", border: "1px solid #ffffff10" }} />
                <Area type="monotone" dataKey="traffic" stroke="#00fbfb" fill="url(#colorTraffic)" strokeWidth={2} />
                <Area type="monotone" dataKey="threats" stroke="#ffb4ab" fill="#ffb4ab10" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-3 glass-card p-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Recent Alerts</h3>
          <div className="space-y-4">
            {initialThreats.map((t) => (
              <div key={t.id} className="p-4 rounded-xl bg-white/[0.02] border-l-4 border-accent-blue">
                <p className="text-[13px] font-bold text-white mb-1">{t.name}</p>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] text-text-muted uppercase font-black tracking-widest">{t.severity}</span>
                  <span className="text-[9px] text-text-muted font-mono">{t.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- APP CORE ---

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="flex min-h-screen bg-bg-primary text-text-primary font-body overflow-x-hidden relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 cyber-grid opacity-10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent-blue/[0.05] rounded-full blur-[160px]" />
          <div className="scanline opacity-20" />
        </div>

        <Sidebar 
          onLogout={() => setIsAuthenticated(false)} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />

        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 backdrop-blur-md sticky top-0 bg-bg-primary/50 z-30">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-text-muted"><Menu /></button>
              <div className="flex items-center gap-2">
                <TerminalIcon className="w-4 h-4 text-accent-blue" />
                <span className="text-xs font-black uppercase tracking-[0.3em] font-label">Kernel v2.4.0_Stable</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-white font-bold leading-none">ROOT_USER</span>
                <span className="text-[8px] text-success uppercase font-black tracking-widest">Authorized</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-accent-blue" />
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-[1400px] mx-auto w-full">
              <AnimatePresence mode="wait">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
}
