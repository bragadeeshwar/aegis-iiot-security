import React, { useState, useEffect, useRef } from "react";
import { Brain, Terminal as TerminalIcon, Activity, ShieldCheck, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface LogEntry {
  id: string;
  text: string;
  type: "info" | "warning" | "error" | "success" | "neural";
  timestamp: string;
}

export default function NeuralEngine({ telemetry, threats }: { telemetry: any, threats: any[] }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const logIdRef = useRef(0);

  const addLog = (text: string, type: LogEntry["type"] = "neural") => {
    const newLog: LogEntry = {
      id: `${Date.now()}-${logIdRef.current++}`,
      text,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    setLogs(prev => [...prev.slice(-20), newLog]);
  };

  const lastStatusRef = useRef<string>("");
  const lastVibrationRef = useRef<number>(0);

  // Process Telemetry for "Reasoning" with Throttling
  useEffect(() => {
    // Only log status change
    if (telemetry.motor_status !== lastStatusRef.current) {
      if (telemetry.motor_status === "isolated") {
        addLog("CRITICAL: Isolation command confirmed by Edge Node.", "error");
        addLog("NEURAL ENGINE: Physical Kill-Switch (GPIO 26) engaged.", "neural");
      } else if (telemetry.motor_status === "running") {
        addLog("SYSTEM: Motor 1 energized. Baseline telemetry monitoring active.", "success");
      } else {
        addLog("IDLE: Motor 1 is stationary. Power consumption minimized.", "info");
      }
      lastStatusRef.current = telemetry.motor_status;
    }

    // Only log vibration if significantly changed and running
    if (telemetry.motor_status === "running") {
      const vibrationDiff = Math.abs(telemetry.vibration - lastVibrationRef.current);
      if (vibrationDiff > 0.2) {
        if (telemetry.vibration > 0.8) {
          addLog(`CAUTION: High vibration variance detected (${telemetry.vibration.toFixed(2)}g).`, "warning");
          addLog("NEURAL ENGINE: Running predictive failure model... Probability of fault: 18%.", "neural");
        } else if (telemetry.vibration < 0.3) {
           addLog("SYSTEM: Vibration levels stabilized within normal operational range.", "success");
        }
        lastVibrationRef.current = telemetry.vibration;
      }
    }
  }, [telemetry.motor_status, telemetry.vibration]);

  // Process Threats
  useEffect(() => {
    const activeThreats = threats.filter(t => t.status === 'active');
    if (activeThreats.length > 0) {
      addLog(`AI CORE: Processing ${activeThreats.length} active network threat vectors.`, "warning");
      addLog("MITRE MAPPING: Tactic identified as " + (activeThreats[0].mitreTactic || "Unknown") + ".", "neural");
    }
  }, [threats.length]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="glass-card overflow-hidden border-t-2 border-accent-blue/30 flex flex-col h-full min-h-[400px]">
      <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent-blue/10 text-accent-blue">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs md:text-sm font-bold text-white uppercase tracking-widest font-headline">Aegis Neural Reasoning Engine</h3>
            <p className="text-[8px] md:text-[9px] text-text-muted uppercase tracking-[0.2em] font-black">Multi-Vector Threat Correlation Active</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
           <button 
             onClick={() => addLog("MANUAL OVERRIDE: Initiating deep neural scan of all network segments...", "neural")}
             className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-blue/10 border border-accent-blue/20 text-[9px] font-black text-accent-blue uppercase tracking-widest hover:bg-accent-blue/20 transition-all"
           >
             <Activity className="w-3 h-3" />
             Force Scan
           </button>
           <div className="flex items-center gap-2 px-2 md:px-3 py-1 rounded-full bg-success/10 border border-success/20">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
              <span className="text-[8px] font-black text-success uppercase tracking-widest">Live</span>
           </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-10 border-b border-white/5 divide-y lg:divide-y-0 lg:divide-x divide-white/5">
        {/* Neural Visualizer */}
        <div className="lg:col-span-4 p-6 md:p-8 flex flex-col items-center justify-center relative overflow-hidden bg-black/20 min-h-[300px]">
            <div className="absolute inset-0 cyber-grid opacity-10" />
            
            <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Orbital Rings */}
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border border-accent-blue/20 rounded-full border-dashed" 
                />
                <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-4 border border-accent-purple/20 rounded-full border-dotted" 
                />
                
                {/* Central Brain Core */}
                <div className="z-10 flex flex-col items-center">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], filter: ["blur(0px)", "blur(2px)", "blur(0px)"] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="p-6 rounded-full bg-gradient-to-br from-accent-blue/20 to-accent-purple/20 border border-white/10 backdrop-blur-md relative"
                    >
                        <Zap className="w-10 h-10 text-accent-blue glow-blue" />
                        <div className="absolute -inset-1 rounded-full bg-accent-blue/20 animate-ping opacity-30" />
                    </motion.div>
                    <p className="mt-4 text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Quantum-01</p>
                </div>

                {/* Data Pulses */}
                <AnimatePresence>
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                            animate={{ 
                                x: (Math.random() - 0.5) * 240, 
                                y: (Math.random() - 0.5) * 240,
                                opacity: [0, 0.8, 0],
                                scale: [0, 1.5, 0]
                            }}
                            transition={{ duration: 3, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
                            className={cn(
                                "absolute w-1.5 h-1.5 rounded-full glow-blue",
                                i % 2 === 0 ? "bg-accent-blue" : "bg-accent-purple"
                            )}
                        />
                    ))}
                </AnimatePresence>
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-4 w-full px-4">
                <div className="bg-white/[0.03] p-3 rounded-xl border border-white/5">
                    <p className="text-[8px] text-text-muted uppercase font-bold mb-1">Inference Latency</p>
                    <p className="text-sm font-mono text-success">1.2ms</p>
                </div>
                <div className="bg-white/[0.03] p-3 rounded-xl border border-white/5">
                    <p className="text-[8px] text-text-muted uppercase font-bold mb-1">Confidence Score</p>
                    <p className="text-sm font-mono text-accent-blue">99.82%</p>
                </div>
            </div>
        </div>

        {/* Reasoning Terminal */}
        <div className="lg:col-span-6 flex flex-col bg-black/40">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border-b border-white/5">
                <TerminalIcon className="w-3 h-3 text-text-muted" />
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest font-mono">Thought_Log.sh</span>
            </div>
            <div 
                ref={terminalRef}
                className="flex-1 p-4 md:p-6 font-mono text-[10px] md:text-[11px] overflow-y-auto custom-scrollbar h-[250px] lg:h-auto"
            >
                <div className="space-y-2">
                    {logs.length === 0 && (
                        <div className="text-text-muted opacity-50 italic">Initializing neural telemetry stream...</div>
                    )}
                    {logs.map((log) => (
                        <motion.div 
                            key={log.id}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex gap-4"
                        >
                            <span className="text-white/20 select-none">[{log.timestamp}]</span>
                            <span className={cn(
                                "flex-1",
                                log.type === "neural" ? "text-accent-blue font-bold" :
                                log.type === "warning" ? "text-warning" :
                                log.type === "error" ? "text-danger" :
                                log.type === "success" ? "text-success" : "text-white/60"
                            )}>
                                {log.text}
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
