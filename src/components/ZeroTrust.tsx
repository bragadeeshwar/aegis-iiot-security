import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  UserCheck, 
  Fingerprint, 
  ShieldAlert,
  ArrowRight,
  Shield
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { devices as initialDevices } from "../mockData";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabaseClient";
import { mapDevices, mapDevice } from "../lib/supabaseMapper";

const PolicyCard = ({ title, description, status, icon: Icon, onToggle, onConfigure, onDelete }: any) => (
  <div className="glass-card p-6 group transition-all relative">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-accent-blue/5 rounded-xl border border-accent-blue/10">
        <Icon className="w-6 h-6 text-accent-blue" />
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={onToggle}
          className={cn(
            "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border transition-all",
            status === "active" ? "bg-success/10 text-success border-success/20" : "bg-bg-secondary/50 text-text-muted border-white/10 hover:border-white/20"
          )}
        >
          {status}
        </button>
        {onDelete && (
          <button 
            onClick={onDelete}
            className="p-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
            title="Delete Policy"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
          </button>
        )}
      </div>
    </div>
    <h4 className="text-sm font-bold text-text-primary mb-2">{title}</h4>
    <p className="text-xs text-text-secondary leading-relaxed mb-4 font-medium">{description}</p>
    <button 
      onClick={onConfigure}
      className="flex items-center gap-2 text-[9px] font-bold text-accent-blue uppercase tracking-widest hover:text-blue-400 transition-colors"
    >
      Configure Policy <ArrowRight className="w-3 h-3" />
    </button>
  </div>
);

export default function ZeroTrust() {
  const [policies, setPolicies] = useState([
    { id: 1, title: "Device Identity Verification", description: "Ensure every device has a unique, cryptographically signed identity certificate.", status: "active", icon: Fingerprint, strict: true },
    { id: 2, title: "Micro-Segmentation", description: "Isolate critical IIoT segments to prevent lateral movement during a breach.", status: "active", icon: Lock, strict: true },
    { id: 3, title: "Least Privilege Access", description: "Grant users and devices only the minimum access required for their specific role.", status: "active", icon: UserCheck, strict: false },
    { id: 4, title: "Adaptive Authentication", description: "Step up authentication requirements based on risk score and location anomalies.", status: "inactive", icon: Key, strict: true },
  ]);

  const [isAuditing, setIsAuditing] = useState(false);
  const [auditProgress, setAuditProgress] = useState(0);
  const [modalType, setModalType] = useState<"logs" | "new" | "configure" | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  
  const [newPolicyName, setNewPolicyName] = useState("");
  const [newPolicyDesc, setNewPolicyDesc] = useState("");

  const [liveDevices, setLiveDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const { data, error } = await supabase.from('devices').select('*');
        if (error) throw error;
        if (data) setLiveDevices(mapDevices(data));
      } catch (e) {
        console.warn("ZeroTrust device fetch failed");
        setLiveDevices(initialDevices);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDevices();

    const channel = supabase
      .channel('zerotrust-devices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLiveDevices(prev => [...prev, mapDevice(payload.new)]);
        } else if (payload.eventType === 'UPDATE') {
          setLiveDevices(prev => prev.map(d => String(d.id) === String(payload.new.id) ? { ...d, ...payload.new, riskScore: payload.new.risk_score } : d));
        } else if (payload.eventType === 'DELETE') {
          setLiveDevices(prev => prev.filter(d => String(d.id) !== String(payload.old.id)));
        }
      })
      .subscribe();

    const interval = setInterval(() => {
      setLiveDevices(prev => prev.map(device => {
        // Don't disturb isolated or offline devices
        if (device.status === 'isolated') return device;
        if (device.status === 'offline') return { ...device, riskScore: 100 };
        // Skip live motor sensor to let Supabase handle it
        if (String(device.id) === 'ESP32-Motor-Sensor' || device.name.toLowerCase().includes('motor')) return device;
        const riskChange = Math.floor(Math.random() * 11) - 5;
        const newRisk = Math.max(0, Math.min(100, (device.riskScore ?? 0) + riskChange));
        return { ...device, riskScore: newRisk };
      }));
    }, 4000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const togglePolicy = (id: number) => {
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, status: p.status === 'active' ? 'inactive' : 'active' } : p));
  };

  const toggleStrictEnforcement = () => {
    if (!selectedPolicy) return;
    setPolicies(prev => prev.map(p => p.id === selectedPolicy.id ? { ...p, strict: !p.strict } : p));
    setSelectedPolicy({ ...selectedPolicy, strict: !selectedPolicy.strict });
  };

  const handleCreatePolicy = () => {
    if (!newPolicyName.trim()) return;
    const newPolicy = {
      id: Date.now(),
      title: newPolicyName,
      description: newPolicyDesc,
      status: "active",
      icon: Shield,
      strict: true
    };
    setPolicies([...policies, newPolicy]);
    setModalType(null);
    setNewPolicyName("");
    setNewPolicyDesc("");
  };

  const runAudit = () => {
    setIsAuditing(true);
    setAuditProgress(0);
    const interval = setInterval(() => {
      setAuditProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsAuditing(false), 1000);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };
  return (
    <div className="space-y-8 md:space-y-10 pb-20 max-w-[1400px] mx-auto px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-2xl md:text-[32px] font-bold tracking-tight text-white mb-1 font-headline uppercase">Zero Trust Management</h2>
          <p className="text-text-muted font-black text-[10px] uppercase tracking-[0.3em] font-label">Continuous verification and identity-based access control.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => setModalType("logs")}
            className="btn-secondary flex-1 md:flex-none py-2 md:py-2.5"
          >
            Audit Logs
          </button>
          <button 
            onClick={() => setModalType("new")}
            className="btn-primary flex-1 md:flex-none py-2 md:py-2.5"
          >
            New Policy
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {policies.map((policy) => (
              <PolicyCard 
                key={policy.id}
                title={policy.title}
                description={policy.description}
                status={policy.status}
                icon={policy.icon}
                onToggle={() => togglePolicy(policy.id)}
                onConfigure={() => {
                  setSelectedPolicy(policy);
                  setModalType("configure");
                }}
                onDelete={() => {
                  setPolicies(prev => prev.filter(p => p.id !== policy.id));
                  if (selectedPolicy?.id === policy.id) {
                    setSelectedPolicy(null);
                    setModalType(null);
                  }
                }}
              />
            ))}
          </div>

          <div className="glass-card p-4 md:p-8">
            <h3 className="text-base md:text-lg font-bold text-white mb-6 md:mb-8 font-headline uppercase italic">Device Trust Scores</h3>
            <div className="space-y-3 md:space-y-4">
              {liveDevices.map((device) => (
                <div key={device.id} className="flex items-center justify-between p-3 md:p-4 bg-bg-secondary/30 border border-white/[0.06] rounded-2xl group hover:bg-bg-secondary/50 transition-all">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className={cn(
                      "w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center border transition-colors",
                      device.riskScore < 20 ? "bg-success/10 border-success/20 text-success shadow-[0_0_10px_rgba(34,197,94,0.2)]" : 
                      device.riskScore < 50 ? "bg-warning/10 border-warning/20 text-warning shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "bg-danger/10 border-danger/20 text-danger shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                    )}>
                      <Shield className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div>
                      <p className="text-xs md:text-sm font-bold text-text-primary">{device.name}</p>
                      <p className="text-[8px] md:text-[9px] text-text-muted uppercase tracking-widest font-bold">{device.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] md:text-[9px] text-text-muted uppercase tracking-widest font-bold mb-1">Trust Score</p>
                    <p className={cn(
                      "text-base md:text-lg font-mono font-bold",
                      device.riskScore < 20 ? "text-success" : 
                      device.riskScore < 50 ? "text-warning" : "text-danger"
                    )}>
                      {100 - device.riskScore}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="glass-card p-6 md:p-8 sticky top-24">
            <div className="flex flex-col items-center text-center space-y-6 md:space-y-8">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-accent-blue rounded-3xl flex items-center justify-center relative glow-blue">
                <ShieldCheck className="w-10 h-10 md:w-12 md:h-12 text-white" />
                <div className="absolute inset-0 rounded-3xl border-4 border-white/20 animate-ping opacity-20" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-2 md:mb-3 font-headline uppercase">Autonomous Enforcement</h3>
                <p className="text-text-muted font-black text-[10px] uppercase tracking-[0.2em] font-label">
                  The AI engine is currently enforcing 12 active zero-trust policies across the network.
                </p>
              </div>
              <div className="w-full space-y-3 md:space-y-4 pt-6 md:pt-8 border-t border-white/5">
                {isAuditing ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
                      <span className="text-accent-blue animate-pulse">Auditing System...</span>
                      <span className="text-text-primary">{auditProgress}%</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${auditProgress}%` }}
                        className="h-full bg-accent-blue glow-blue"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] md:text-[10px] text-text-muted uppercase font-bold tracking-widest">Policy Violations (24h)</span>
                      <span className="text-xs text-text-primary font-mono font-bold">0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] md:text-[10px] text-text-muted uppercase font-bold tracking-widest">Auto-Isolated Nodes</span>
                      <span className="text-xs text-text-primary font-mono font-bold">
                        {liveDevices.filter(d => d.status === 'isolated').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] md:text-[10px] text-text-muted uppercase font-bold tracking-widest">Verification Requests</span>
                      <span className="text-xs text-text-primary font-mono font-bold">1,242</span>
                    </div>
                  </>
                )}
              </div>
              <button 
                onClick={runAudit}
                disabled={isAuditing}
                className={cn(
                  "w-full py-3 md:py-4 bg-text-primary text-bg-primary text-[9px] md:text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg",
                  isAuditing ? "opacity-50 cursor-not-allowed" : "hover:bg-white/90"
                )}
              >
                {isAuditing ? "Audit in Progress" : "Run Compliance Audit"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalType(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg glass-card p-6 md:p-8 overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-accent-blue" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-primary">
                      {modalType === 'logs' ? 'Audit Logs' : 
                       modalType === 'new' ? 'Create New Policy' : 
                       `Configure: ${selectedPolicy?.title}`}
                    </h3>
                    <p className="text-[9px] text-text-muted uppercase tracking-widest font-bold">Zero Trust Framework</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {modalType === 'logs' ? (
                  <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    {[
                      { time: "14:48:32", event: "Identity verification passed: PLC-01", type: "success" },
                      { time: "14:45:12", event: "Micro-segmentation policy updated", type: "info" },
                      { time: "14:30:05", event: "Unauthorized access blocked: Gateway-04", type: "warning" },
                      { time: "14:12:44", event: "Compliance audit completed: 100% pass", type: "success" },
                      { time: "13:55:21", event: "New device onboarded via zero-trust", type: "info" },
                    ].map((log, i) => (
                      <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex gap-4">
                        <span className="text-[9px] font-mono text-text-muted shrink-0">{log.time}</span>
                        <p className={cn(
                          "text-[11px] font-medium",
                          log.type === 'warning' ? "text-warning" : 
                          log.type === 'success' ? "text-success" : "text-text-secondary"
                        )}>{log.event}</p>
                      </div>
                    ))}
                  </div>
                ) : modalType === 'new' ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Policy Name</label>
                      <input 
                        type="text" 
                        value={newPolicyName}
                        onChange={(e) => setNewPolicyName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-accent-blue/30 text-text-primary" 
                        placeholder="Enter policy name..." 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Description</label>
                      <textarea 
                        value={newPolicyDesc}
                        onChange={(e) => setNewPolicyDesc(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-accent-blue/30 h-24 text-text-primary" 
                        placeholder="Describe the policy scope..." 
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-accent-blue/5 border border-accent-blue/10 rounded-xl">
                      <p className="text-xs text-text-secondary leading-relaxed font-medium">
                        Configure the enforcement level and verification methods for this policy. Changes will be applied autonomously across all tagged devices.
                      </p>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                      <span className="text-xs font-bold text-text-primary">Strict Enforcement</span>
                      <div 
                        onClick={toggleStrictEnforcement}
                        className={cn(
                          "w-10 h-5 rounded-full relative cursor-pointer transition-colors",
                          selectedPolicy?.strict ? "bg-accent-blue glow-blue" : "bg-white/10"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                          selectedPolicy?.strict ? "right-1" : "left-1"
                        )} />
                      </div>
                    </div>
                    <div className="pt-4 border-t border-white/[0.06]">
                      <button 
                        onClick={() => {
                          setPolicies(prev => prev.filter(p => p.id !== selectedPolicy.id));
                          setModalType(null);
                          setSelectedPolicy(null);
                        }}
                        className="w-full py-3 bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all"
                      >
                        Delete Policy
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setModalType(null)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-text-primary text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all"
                >
                  {modalType === 'logs' ? 'Close' : 'Cancel'}
                </button>
                {modalType !== 'logs' && (
                  <button 
                    onClick={modalType === 'new' ? handleCreatePolicy : () => setModalType(null)}
                    className="flex-1 py-3 bg-accent-blue text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all glow-blue"
                  >
                    {modalType === 'new' ? 'Create Policy' : 'Save Changes'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
