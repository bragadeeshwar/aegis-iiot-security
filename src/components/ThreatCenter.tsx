import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  ChevronRight, 
  ExternalLink, 
  Clock, 
  Target, 
  Zap,
  CheckCircle2,
  AlertTriangle,
  Info,
  Terminal as TerminalIcon,
  Brain
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { threats } from "../mockData";
import { cn } from "../lib/utils";
import { ThreatSeverity } from "../types";
import { u } from "motion/react-client";
import { supabase } from "../lib/supabaseClient";
import { mapThreat, mapThreats } from "../lib/supabaseMapper";
import { siemLogger } from "../lib/siemLogger";

const SeverityBadge = ({ severity }: { severity: ThreatSeverity }) => {
  const styles = {
    critical: "bg-danger/20 text-danger border-danger/30",
    high: "bg-warning/20 text-warning border-warning/30",
    medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    low: "bg-accent-blue/20 text-accent-blue border-accent-blue/30",
  };

  return (
    <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border", styles[severity])}>
      {severity}
    </span>
  );
};

const NeuralInsight = ({ threat }: { threat: any }) => {
  const [logs, setLogs] = useState<{ id: string, text: string, type: string, timestamp: string }[]>([]);
  const logIdRef = useRef(0);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!threat) return;
    
    setLogs([]);
    const initialLogs = [
      { id: '1', text: `AI CORE: Analyzing vector for ${threat.name}...`, type: 'neural', timestamp: new Date().toLocaleTimeString() },
      { id: '2', text: `PATTERN: Identifying MITRE Tactic: ${threat.mitreTactic || 'General Anomaly'}`, type: 'info', timestamp: new Date().toLocaleTimeString() }
    ];
    setLogs(initialLogs);

    const interval = setInterval(() => {
      const texts = [
        "Correlating multi-vector telemetry signals...",
        "Evaluating historical baseline deviations: 0.82-sigma",
        "Assessing lateral movement probability: 12%",
        "Neural Engine: Confidence score adjusted to 98.4%",
        "Recommendation: Monitor industrial gateway for further entropy."
      ];
      const randomText = texts[Math.floor(Math.random() * texts.length)];
      setLogs(prev => [...prev.slice(-4), { 
        id: String(Date.now()), 
        text: randomText, 
        type: 'neural', 
        timestamp: new Date().toLocaleTimeString() 
      }]);
    }, 4000);

    return () => clearInterval(interval);
  }, [threat.id]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-black/40 rounded-2xl border border-white/5 overflow-hidden flex flex-col h-[200px]">
      <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border-b border-white/5">
        <TerminalIcon className="w-3 h-3 text-accent-blue" />
        <span className="text-[9px] font-black text-text-muted uppercase tracking-widest font-mono">Neural_Reasoning_Insight.log</span>
      </div>
      <div ref={terminalRef} className="flex-1 p-4 font-mono text-[10px] overflow-y-auto custom-scrollbar space-y-2">
        {logs.map(log => (
          <div key={log.id} className="flex gap-3">
            <span className="text-white/20 select-none">[{log.timestamp.split(' ')[0]}]</span>
            <span className={cn(log.type === 'neural' ? "text-accent-blue" : "text-text-muted")}>
              {log.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ThreatCenter() {
  const [threatsList, setThreatsList] = useState<any[]>([]);
  const [selectedThreat, setSelectedThreat] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<ThreatSeverity | "all">("all");
  const detailsRef = React.useRef<HTMLDivElement>(null);

  const handleThreatSelect = (threat: any) => {
    setSelectedThreat(threat);
    if (window.innerWidth < 1024 && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const filteredThreats = threatsList.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === "all" || t.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const handleRemediate = async (id: string | number) => {
    // Optimistic Update
    setThreatsList(prev => prev.map(t => t.id === id ? { ...t, status: 'remediated' } : t));
    const threat = threatsList.find(t => t.id === id);
    if (threat) {
      siemLogger.logThreat(threat.name, threat.severity, 'REMEDIATED', { tactic: threat.mitreTactic, technique: threat.mitreTechnique });
      setSelectedThreat(prev => prev && prev.id === id ? { ...prev, status: 'remediated' } : prev);
    }
    
    // Cloud sync if applicable
    if (id) {
      try {
        await supabase.from('threats').update({ status: 'remediated' }).eq('id', id);
      } catch (e) {
        console.error("Cloud remediation sync failed");
      }
    }
  };

  const handleIgnore = (id: string | number) => {
    const threatToIgnore = threatsList.find(t => t.id === id);
    if (threatToIgnore) {
      siemLogger.logThreat(threatToIgnore.name, threatToIgnore.severity, 'IGNORED');
    }
    const newList = threatsList.filter(t => t.id !== id);
    setThreatsList(newList);
    if (selectedThreat?.id === id) {
      setSelectedThreat(newList[0] || null);
    }
  };

  const handleIsolate = async (id: string | number) => {
    setThreatsList(prev => prev.map(t => t.id === id ? { ...t, status: 'isolated' } : t));
    const threat = threatsList.find(t => t.id === id);
    if (threat) {
      siemLogger.logThreat(threat.name, threat.severity, 'ISOLATED', { tactic: threat.mitreTactic, technique: threat.mitreTechnique });
      if (selectedThreat?.id === id) {
        setSelectedThreat(prev => prev ? { ...prev, status: 'isolated' } : null);
      }
    }

    if (id) {
      try {
        await supabase.from('threats').update({ status: 'isolated' }).eq('id', id);
      } catch (e) {
        console.error("Cloud isolation sync failed");
      }
    }
  };

  // Initial Fetch & Real-time subscription
  useEffect(() => {
    const fetchThreats = async () => {
      try {
        const { data, error } = await supabase
          .from('threats')
          .select('*')
          .order('timestamp', { ascending: false });
        
        if (error) throw error;
        if (data) {
          const mapped = mapThreats(data);
          setThreatsList(mapped);
          if (mapped.length > 0) setSelectedThreat(mapped[0]);
        }
      } catch (err) {
        console.error("Error fetching threats:", err);
        setThreatsList(threats);
        if (threats.length > 0) setSelectedThreat(threats[0]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThreats();

    const channel = supabase
      .channel('threats-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'threats' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const mapped = mapThreat(payload.new as any);
          setThreatsList(prev => [mapped, ...prev]);
          
          // Real-time SIEM Dispatch for new threats
          siemLogger.logThreat(
            mapped.name, 
            mapped.severity, 
            'INITIAL_DETECTION', 
            { tactic: mapped.mitreTactic, technique: mapped.mitreTechnique }
          );
        } else if (payload.eventType === 'UPDATE') {
          setThreatsList(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t));
          setSelectedThreat(prev => prev && prev.id === payload.new.id ? { ...prev, ...payload.new } : prev);
        } else if (payload.eventType === 'DELETE') {
          setThreatsList(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-8 md:space-y-10 pb-20 max-w-[1400px] mx-auto px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-2xl md:text-[32px] font-bold tracking-tight text-white mb-1 font-headline uppercase">Threat Center</h2>
          <p className="text-text-muted font-black text-[10px] uppercase tracking-[0.3em] font-label">Real-time anomaly detection and incident management.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative group flex-1 md:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent-blue transition-colors" />
            <input 
              type="text" 
              placeholder="Search incidents..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-bg-secondary/50 border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/30 transition-all w-full md:w-64"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
            {(["all", "critical", "high", "medium", "low"] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={cn(
                  "px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border font-label shrink-0",
                  severityFilter === sev 
                    ? "bg-accent-blue/10 border-accent-blue/30 text-accent-blue shadow-[0_0_15px_rgba(0,251,251,0.1)]" 
                    : "bg-bg-secondary/50 border-white/5 text-text-muted hover:text-text-primary"
                )}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {isLoading ? (
          <div className="lg:col-span-12 py-20 glass flex flex-col items-center justify-center rounded-2xl border border-white/5">
             <div className="w-10 h-10 border-4 border-accent-blue/10 border-t-accent-blue rounded-full animate-spin mb-4" />
             <p className="text-[10px] font-bold text-accent-blue uppercase tracking-widest animate-pulse font-label">Accessing Threat Intelligence...</p>
          </div>
        ) : (
          <>
            <div className={cn("lg:col-span-5 space-y-4", selectedThreat && "hidden lg:block")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {filteredThreats.map((threat) => (
              <motion.div
                key={threat.id}
                onClick={() => handleThreatSelect(threat)}
                whileHover={{ x: 4 }}
                className={cn(
                  "p-4 md:p-5 rounded-2xl border transition-all cursor-pointer group",
                  selectedThreat?.id === threat.id 
                    ? "bg-accent-blue/5 border-accent-blue/20 shadow-[0_0_20px_rgba(79,140,255,0.05)]" 
                    : "bg-bg-secondary/30 border-white/[0.06] hover:border-white/10"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                      threat.status === 'remediated' ? "bg-success/10 text-success" :
                      threat.status === 'isolated' ? "bg-warning/10 text-warning" :
                      threat.severity === "critical" ? "bg-danger/10 text-danger shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "bg-warning/10 text-warning"
                    )}>
                      {threat.status === 'remediated' ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : <ShieldAlert className="w-5 h-5 md:w-6 md:h-6" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary group-hover:text-accent-blue transition-colors">{threat.name}</h4>
                      <p className="text-[9px] text-text-muted uppercase tracking-widest font-bold mt-1">{threat.timestamp}</p>
                    </div>
                  </div>
                  <SeverityBadge severity={threat.severity} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-text-muted" />
                    <span className="text-[10px] text-text-secondary font-mono font-bold">{threat.target}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {threat.status === 'remediated' && (
                      <span className="text-[8px] text-success font-bold uppercase tracking-widest px-2 py-0.5 bg-success/10 rounded border border-success/20">Remediated</span>
                    )}
                    {threat.status === 'isolated' && (
                      <span className="text-[8px] text-warning font-bold uppercase tracking-widest px-2 py-0.5 bg-warning/10 rounded border border-warning/20">Isolated</span>
                    )}
                    <ChevronRight className={cn("w-5 h-5 transition-transform", selectedThreat?.id === threat.id ? "text-accent-blue translate-x-1" : "text-text-muted")} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          {filteredThreats.length === 0 && (
            <div className="p-12 text-center glass-card">
              <p className="text-text-muted font-bold text-[10px] uppercase tracking-widest">No matching incidents</p>
            </div>
          )}
        </div>

        <div ref={detailsRef} className={cn("lg:col-span-7", !selectedThreat && "hidden lg:block")}>
          <AnimatePresence mode="wait">
            {selectedThreat ? (
              <motion.div
                key={selectedThreat.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="glass-card p-4 md:p-8 h-full relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-accent-blue/5 blur-[100px] -mr-32 -mt-32 md:-mr-48 md:-mt-48" />
                
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8 md:mb-10">
                    <div>
                      <div className="flex items-center gap-3 mb-4 lg:hidden">
                        <button 
                          onClick={() => setSelectedThreat(null)}
                          className="flex items-center gap-2 text-[10px] font-black text-accent-blue uppercase tracking-widest bg-accent-blue/10 px-3 py-1.5 rounded-lg border border-accent-blue/20"
                        >
                          <ChevronRight className="w-4 h-4 rotate-180" />
                          Back to List
                        </button>
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <SeverityBadge severity={selectedThreat.severity} />
                        <span className="text-[9px] text-text-muted uppercase tracking-widest font-bold">Incident #{selectedThreat.id}</span>
                      </div>
                      <h3 className="text-xl md:text-[24px] font-bold text-white font-headline uppercase">{selectedThreat.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                      <button 
                        onClick={() => handleIgnore(selectedThreat.id)}
                        className="btn-secondary flex-1 sm:flex-none py-2 md:py-2.5"
                      >
                        Ignore
                      </button>
                      <button 
                        onClick={() => handleIsolate(selectedThreat.id)}
                        disabled={selectedThreat.status === 'remediated' || selectedThreat.status === 'isolated'}
                        className={cn(
                          "px-4 py-2 md:py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                          selectedThreat.status === 'remediated' || selectedThreat.status === 'isolated'
                            ? "bg-white/5 text-text-muted border-white/5 cursor-not-allowed"
                            : "bg-warning/10 text-warning border-warning/20 hover:bg-warning/20"
                        )}
                      >
                        {selectedThreat.status === 'isolated' ? 'Isolated' : 'Isolate Device'}
                      </button>
                      <button 
                        onClick={() => handleRemediate(selectedThreat.id)}
                        disabled={selectedThreat.status === 'remediated'}
                        className={cn(
                          "btn-primary flex-1 sm:flex-none py-2 md:py-2.5",
                          selectedThreat.status === 'remediated' && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {selectedThreat.status === 'remediated' ? 'Remediated' : 'Remediate'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-10">
                    <div className="space-y-4 md:space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 md:p-3 bg-bg-secondary/50 rounded-xl border border-white/5">
                          <Clock className="w-4 h-4 md:w-5 md:h-5 text-text-muted" />
                        </div>
                        <div>
                          <p className="text-[9px] text-text-muted uppercase tracking-widest font-bold mb-1">Detection Time</p>
                          <p className="text-xs text-text-primary font-mono font-bold">{selectedThreat.timestamp}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 md:p-3 bg-bg-secondary/50 rounded-xl border border-white/5">
                          <Target className="w-4 h-4 md:w-5 md:h-5 text-text-muted" />
                        </div>
                        <div>
                          <p className="text-[9px] text-text-muted uppercase tracking-widest font-bold mb-1">Target Asset</p>
                          <p className="text-xs text-text-primary font-mono font-bold">{selectedThreat.target}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4 md:space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 md:p-3 bg-bg-secondary/50 rounded-xl border border-white/5">
                          <ExternalLink className="w-4 h-4 md:w-5 md:h-5 text-text-muted" />
                        </div>
                        <div>
                          <p className="text-[9px] text-text-muted uppercase tracking-widest font-bold mb-1">Source Origin</p>
                          <p className="text-xs text-text-primary font-mono font-bold">{selectedThreat.source}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 md:p-3 bg-bg-secondary/50 rounded-xl border border-white/5">
                          <Zap className="w-4 h-4 md:w-5 md:h-5 text-text-muted" />
                        </div>
                        <div>
                          <p className="text-[9px] text-text-muted uppercase tracking-widest font-bold mb-1">Response Status</p>
                          <p className="text-xs text-accent-blue font-bold uppercase tracking-widest">{selectedThreat.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 md:space-y-8">
                    <div>
                      <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">Incident Description</h4>
                      <div className="text-[11px] md:text-sm text-text-secondary leading-relaxed bg-bg-secondary/30 p-4 md:p-6 rounded-2xl border border-white/5 font-medium">
                        {selectedThreat.description}
                      </div>
                    </div>

                    {selectedThreat.mitreTactic && (
                      <div>
                        <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">MITRE ATT&CK® Mapping</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="p-4 bg-bg-secondary/40 border border-white/5 rounded-2xl">
                            <p className="text-[9px] text-text-muted uppercase font-bold tracking-widest mb-1">Tactic</p>
                            <p className="text-xs text-text-primary font-bold">{selectedThreat.mitreTactic}</p>
                          </div>
                          <div className="p-4 bg-bg-secondary/40 border border-white/5 rounded-2xl">
                            <p className="text-[9px] text-text-muted uppercase font-bold tracking-widest mb-1">Technique</p>
                            <p className="text-xs text-accent-blue font-bold">{selectedThreat.mitreTechnique}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">Neural Insight Terminal</h4>
                      <NeuralInsight threat={selectedThreat} />
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">AI Analysis & Recommendations</h4>
                      {(() => {
                        const analysis = {
                          "Unauthorized Access Attempt": {
                            pattern: "Repeated failed authentication attempts from an external IP address targeting the control interface.",
                            impact: "Potential unauthorized control of IIoT assets, data exfiltration, or system configuration changes.",
                            remediation: ["Block the source IP address in the firewall.", "Enforce strict MFA for all control interface access.", "Review audit logs for any successful logins from the source IP."]
                          },
                          "DDoS Anomaly": {
                            pattern: "High-volume UDP traffic flood targeting the main gateway, causing bandwidth saturation.",
                            impact: "System downtime, loss of connectivity to IIoT devices, and disruption of critical industrial processes.",
                            remediation: ["Enable rate limiting on the gateway.", "Reroute traffic through a DDoS mitigation service.", "Identify and block the source of the traffic flood."]
                          },
                          "Firmware Tampering": {
                            pattern: "Hash mismatch detected in a firmware update package, indicating potential unauthorized modification.",
                            impact: "Compromise of device integrity, potential for malicious code execution, and loss of device control.",
                            remediation: ["Immediately halt the firmware update process.", "Verify the integrity of the firmware package using cryptographic signatures.", "Roll back devices to the last known good firmware version."]
                          }
                        }[selectedThreat.name] || {
                          pattern: "Anomalous activity detected in the network segment.",
                          impact: "Potential disruption of services or unauthorized access.",
                          remediation: ["Investigate the source of the activity.", "Isolate the affected device.", "Review security policies."]
                        };

                        return (
                          <div className="space-y-4">
                            <div className="p-4 md:p-6 bg-accent-blue/5 border border-accent-blue/10 rounded-2xl">
                              <h5 className="text-[10px] font-bold text-accent-blue uppercase tracking-widest mb-2">Threat Pattern</h5>
                              <p className="text-[11px] md:text-xs text-text-secondary leading-relaxed font-medium">{analysis.pattern}</p>
                            </div>
                            <div className="p-4 md:p-6 bg-danger/5 border border-danger/10 rounded-2xl">
                              <h5 className="text-[10px] font-bold text-danger uppercase tracking-widest mb-2">Potential Impact</h5>
                              <p className="text-[11px] md:text-xs text-text-secondary leading-relaxed font-medium">{analysis.impact}</p>
                            </div>
                            <div className="p-4 md:p-6 bg-success/5 border border-success/10 rounded-2xl">
                              <h5 className="text-[10px] font-bold text-success uppercase tracking-widest mb-2">Remediation Steps</h5>
                              <ul className="list-disc list-inside text-[11px] md:text-xs text-text-secondary leading-relaxed font-medium space-y-1">
                                {analysis.remediation.map((step, i) => <li key={i}>{step}</li>)}
                              </ul>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="glass-card p-12 h-full flex flex-col items-center justify-center text-center">
                <ShieldAlert className="w-16 h-16 text-text-muted/30 mb-4" />
                <h3 className="text-lg font-bold text-text-primary mb-2">No Incident Selected</h3>
                <p className="text-sm text-text-muted max-w-sm">Select an incident from the list to view details, analysis, and remediation options.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
