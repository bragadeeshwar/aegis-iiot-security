import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Shield, 
  Cpu, 
  Network, 
  ShieldAlert, 
  Zap, 
  Fingerprint, 
  FileText, 
  Settings, 
  LogOut,
  User,
  Activity,
  ChevronRight,
  Radio,
  Terminal as TerminalIcon
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface SidebarProps {
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { name: "Dashboard",        path: "/",           icon: LayoutDashboard, section: "main" },
  { name: "Device Inventory", path: "/devices",    icon: Cpu,             section: "main" },
  { name: "Network Map",      path: "/network",    icon: Network,         section: "main" },
  { name: "Threat Center",    path: "/threats",    icon: ShieldAlert,     section: "security" },
  { name: "Attack Sim",       path: "/simulation", icon: Zap,             section: "security" },
  { name: "Zero Trust",       path: "/zero-trust", icon: Fingerprint,     section: "security" },
  { name: "Command Center",   path: "/terminal",   icon: TerminalIcon,    section: "security" },
  { name: "Reports",          path: "/reports",    icon: FileText,        section: "analytics" },
  { name: "Settings",         path: "/settings",   icon: Settings,        section: "system" },
];

const sections: Record<string, string> = {
  main:      "Monitoring",
  security:  "Security",
  analytics: "Analytics",
  system:    "System",
};

export default function Sidebar({ onLogout, isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  // Group nav items by section
  const grouped = navItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof navItems>);

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[90] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-[100] w-[270px] flex flex-col",
        "transition-transform duration-500 ease-in-out transform",
        "border-r border-white/[0.05]",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
        style={{
          background: "linear-gradient(180deg, #110d18 0%, #0e0a14 100%)",
        }}
      >
        {/* Ambient glow at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent-blue/5 rounded-full blur-3xl pointer-events-none" />

        {/* ── Logo ─────────────────────────────────── */}
        <div className="px-6 pt-7 pb-5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center shadow-[0_0_20px_rgba(0,245,255,0.3)]">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-black text-sm font-headline tracking-widest">AEGIS IIOT</div>
              <div className="text-[9px] text-accent-blue/60 font-label font-bold uppercase tracking-[0.3em]">Obsidian Protocol</div>
            </div>
          </div>
        </div>

        {/* ── Profile Card ──────────────────────────── */}
        <div className="mx-4 mb-5 relative z-10">
          <div className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] flex items-center gap-4"
            style={{ background: "linear-gradient(135deg, rgba(0,245,255,0.04) 0%, rgba(192,132,252,0.03) 100%)" }}>
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 border border-white/10 flex items-center justify-center">
                <User className="w-5 h-5 text-accent-blue" />
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-bg-primary shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-text-primary font-headline truncate">Lead Operator</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 bg-accent-blue rounded-full shadow-[0_0_6px_rgba(0,245,255,0.8)] animate-pulse" />
                <span className="text-[9px] text-accent-blue font-black uppercase tracking-widest font-label">L6 CLEARANCE</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Navigation ────────────────────────────── */}
        <nav className="flex-1 px-3 space-y-5 overflow-y-auto custom-scrollbar relative z-10">
          {Object.entries(grouped).map(([section, items]) => (
            <div key={section}>
              <p className="px-3 mb-2 text-[9px] font-black text-text-muted/50 uppercase tracking-[0.3em] font-label">
                {sections[section]}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={() => cn(
                        "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group overflow-hidden font-label",
                        isActive
                          ? "bg-accent-blue/10 text-accent-blue border border-accent-blue/[0.15] shadow-[0_0_20px_rgba(0,245,255,0.04)]"
                          : "text-text-muted hover:text-text-secondary hover:bg-white/[0.03] border border-transparent"
                      )}
                    >
                      {/* Active bg glow */}
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-accent-blue/5 to-transparent pointer-events-none" />
                      )}

                      {/* Active indicator bar */}
                      {isActive && (
                        <motion.div
                          layoutId="activeTabBar"
                          className="absolute left-0 top-2 bottom-2 w-[3px] bg-gradient-to-b from-accent-blue to-accent-purple rounded-r-full"
                        />
                      )}

                      <item.icon className={cn(
                        "w-[18px] h-[18px] shrink-0 transition-all duration-300",
                        isActive ? "text-accent-blue" : "text-text-muted/60 group-hover:text-text-muted"
                      )} />

                      <span className="text-[11px] font-bold uppercase tracking-[0.12em] relative z-10">{item.name}</span>

                      {isActive && (
                        <ChevronRight className="w-3.5 h-3.5 ml-auto text-accent-blue/50 relative z-10" />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Footer ────────────────────────────────── */}
        <div className="px-4 pb-6 pt-4 space-y-3 relative z-10 border-t border-white/[0.04]">
          {/* System health */}
          <div className="px-3 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2.5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-success animate-pulse" />
                <span className="text-[9px] text-text-muted font-black uppercase tracking-widest font-label">Sys Integrity</span>
              </div>
              <span className="text-[9px] text-success font-black uppercase tracking-widest">94% Stable</span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "94%" }}
                transition={{ duration: 2.5, delay: 0.5, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-accent-blue to-accent-purple rounded-full"
                style={{ boxShadow: "0 0 8px rgba(0,245,255,0.4)" }}
              />
            </div>
          </div>

          {/* Version badge */}
          <div className="px-3 flex items-center justify-between">
            <span className="text-[9px] text-text-muted/40 font-mono">v2.0.4-stable</span>
            <span className="text-[8px] text-text-muted/30 font-mono uppercase tracking-widest">BUILD #1042</span>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-text-muted/60 hover:text-danger hover:bg-danger/5 rounded-xl transition-all group font-label border border-transparent hover:border-danger/10"
          >
            <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span className="text-[11px] font-bold uppercase tracking-[0.12em]">Terminate Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
