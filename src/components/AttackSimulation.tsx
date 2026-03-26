import React, { useState, useRef, useEffect } from "react";
import { 
  Zap, 
  Play, 
  Pause, 
  RotateCcw, 
  ShieldAlert, 
  Activity, 
  Target, 
  Cpu,
  AlertTriangle,
  Info,
  Download,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { siemLogger } from "../lib/siemLogger";
import { supabase } from "../lib/supabaseClient";

const simulations = [
  { 
    id: "sim1", 
    name: "DDoS Attack", 
    type: "Network", 
    severity: "critical", 
    description: "Simulate a high-volume UDP flood targeting the main gateway to test system resilience.",
    mitreTactic: "Impact (TA0040)",
    mitreTechnique: "Endpoint Denial of Service (T1499)"
  },
  { 
    id: "sim2", 
    name: "MITM Interception", 
    type: "Communication", 
    severity: "high", 
    description: "Simulate an attacker intercepting Modbus traffic between PLC and HMI.",
    mitreTactic: "Lateral Movement (TA0008)",
    mitreTechnique: "Exploitation of Remote Services (T1210)"
  },
  { 
    id: "sim3", 
    name: "Credential Spoofing", 
    type: "Access", 
    severity: "medium", 
    description: "Simulate an unauthorized user attempting to access the control interface with stolen credentials.",
    mitreTactic: "Credential Access (TA0006)",
    mitreTechnique: "Brute Force (T1110)"
  },
  { 
    id: "sim4", 
    name: "Firmware Injection", 
    type: "Integrity", 
    severity: "high", 
    description: "Simulate a malicious firmware update being pushed to a group of sensors.",
    mitreTactic: "Persistence (TA0003)",
    mitreTechnique: "System Firmware (T1542.001)"
  },
  { 
    id: "sim5", 
    name: "Motor Overdrive Attack", 
    type: "Physical", 
    severity: "critical", 
    description: "Simulate an attacker bypassing safety interlocks to artificially drive the motor past safe operating limits.",
    mitreTactic: "Impact (TA0040)",
    mitreTechnique: "Inhibit Response Function (T1495)"
  },
];

const simDetails: Record<string, { logs: { p: number, text: string, color: string }[], insight: string }> = {
  sim1: {
    logs: [
      { p: 0, text: "> Initializing DDoS simulation sequence...", color: "text-success" },
      { p: 5, text: "> Injecting UDP flood payload into main gateway...", color: "text-text-secondary" },
      { p: 15, text: "> WARNING: Unusual traffic pattern detected on port 443", color: "text-warning" },
      { p: 25, text: "> CRITICAL: Bandwidth saturation reaching 85%", color: "text-danger" },
      { p: 40, text: "> Aegis AI: Engaging automated defense protocols", color: "text-accent-blue" },
      { p: 60, text: "> Rerouting suspicious traffic to honeypot...", color: "text-text-secondary" },
      { p: 80, text: "> Threat contained. Restoring normal operations.", color: "text-success" },
      { p: 100, text: "> Simulation complete. System secure.", color: "text-success font-bold" }
    ],
    insight: "The system has automatically identified the attack pattern as a DDoS flood. Zero-trust policies are restricting all non-essential traffic to the gateway. System availability remains at 99.9%."
  },
  sim2: {
    logs: [
      { p: 0, text: "> Initializing MITM simulation sequence...", color: "text-success" },
      { p: 5, text: "> Attempting ARP spoofing on internal subnet...", color: "text-text-secondary" },
      { p: 15, text: "> WARNING: Duplicate MAC addresses detected", color: "text-warning" },
      { p: 25, text: "> CRITICAL: Unauthorized interception of Modbus traffic", color: "text-danger" },
      { p: 40, text: "> Aegis AI: Enforcing strict TLS verification", color: "text-accent-blue" },
      { p: 60, text: "> Isolating compromised node from PLC network...", color: "text-text-secondary" },
      { p: 80, text: "> Communication secured. Re-establishing trusted links.", color: "text-success" },
      { p: 100, text: "> Simulation complete. System secure.", color: "text-success font-bold" }
    ],
    insight: "The system detected an unauthorized device attempting to intercept Modbus traffic. Micro-segmentation policies immediately isolated the node, preventing any data manipulation."
  },
  sim3: {
    logs: [
      { p: 0, text: "> Initializing Credential Spoofing simulation...", color: "text-success" },
      { p: 5, text: "> Initiating login sequence with compromised credentials...", color: "text-text-secondary" },
      { p: 15, text: "> WARNING: Login attempt from anomalous geolocation", color: "text-warning" },
      { p: 25, text: "> CRITICAL: Multiple failed MFA challenges", color: "text-danger" },
      { p: 40, text: "> Aegis AI: Triggering adaptive authentication lock", color: "text-accent-blue" },
      { p: 60, text: "> Revoking compromised session tokens...", color: "text-text-secondary" },
      { p: 80, text: "> Account secured. Forcing password reset.", color: "text-success" },
      { p: 100, text: "> Simulation complete. System secure.", color: "text-success font-bold" }
    ],
    insight: "Adaptive authentication successfully blocked the spoofing attempt by detecting an anomalous login location and enforcing a strict MFA challenge, which the attacker failed."
  },
  sim4: {
    logs: [
      { p: 0, text: "> Initializing Firmware Injection simulation...", color: "text-success" },
      { p: 5, text: "> Pushing unsigned firmware payload to sensor group A...", color: "text-text-secondary" },
      { p: 15, text: "> WARNING: Unverified signature detected in update package", color: "text-warning" },
      { p: 25, text: "> CRITICAL: Integrity check failed for sensor firmware", color: "text-danger" },
      { p: 40, text: "> Aegis AI: Halting OTA update process", color: "text-accent-blue" },
      { p: 60, text: "> Quarantining malicious payload...", color: "text-text-secondary" },
      { p: 80, text: "> Rolling back sensors to last known good state.", color: "text-success" },
      { p: 100, text: "> Simulation complete. System secure.", color: "text-success font-bold" }
    ],
    insight: "The zero-trust architecture prevented the malicious firmware update by enforcing strict cryptographic signature verification before allowing the OTA process to proceed."
  },
  sim5: {
    logs: [
      { p: 0, text: "> Initializing Motor Overdrive simulation...", color: "text-success" },
      { p: 5, text: "> Bypassing safety interlocks on Motor Controller...", color: "text-text-secondary" },
      { p: 15, text: "> WARNING: Unexplained vibration spike detected", color: "text-warning" },
      { p: 25, text: "> CRITICAL: Motor risk score escalating past >90", color: "text-danger" },
      { p: 40, text: "> Aegis AI: Automatically isolating ESP32-Motor-Sensor", color: "text-accent-blue" },
      { p: 60, text: "> Emergency stop command issued globally...", color: "text-text-secondary" },
      { p: 80, text: "> Physical components secured. Restoring baseline.", color: "text-success" },
      { p: 100, text: "> Simulation complete. System secure.", color: "text-success font-bold" }
    ],
    insight: "Aegis AI successfully identified an anomalous vibration pattern indicative of a physical impact attack. It instantly issued an isolation command to the ESP32 Motor Sensor when its risk score bypassed the critical 90 threshold, preventing hardware damage."
  }
};

export default function AttackSimulation() {
  const [activeSim, setActiveSim] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeThreatId, setActiveThreatId] = useState<string | null>(null);
  const targetDeviceRef = useRef<string>("Gateway-Main");
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const startSim = (id: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActiveSim(id);
    setProgress(0);
    setIsPaused(false);
    setIsDownloading(false);
    
    if (window.innerWidth < 1024 && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    const sim = simulations.find(s => s.id === id);
    // For demo purposes, all simulations will forcefully target the physical ESP32 motor sensor
    // to dynamically prove that the AI isolates physical hardware during network/cyber attacks.
    targetDeviceRef.current = 'ESP32-Motor-Sensor';

    siemLogger.log({
      event: 'SIMULATION_STARTED',
      severity: 'INFO',
      source: 'AttackSimulator',
      mitreTactic: sim?.mitreTactic,
      mitreTechnique: sim?.mitreTechnique,
      details: { scenario: sim?.name, type: sim?.type }
    });

    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            siemLogger.log({
              event: 'SIMULATION_COMPLETED',
              severity: 'AUDIT',
              source: 'AttackSimulator',
              details: { scenario: simulations.find(s => s.id === id)?.name }
            });
          }
          return 100;
        }
        return prev + 1;
      });
    }, 100);
  };

  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 100;
          }
          return prev + 1;
        });
      }, 100);
    } else {
      setIsPaused(true);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  };

  const resetSim = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    setProgress(0);
    setIsPaused(false);
    setIsDownloading(false);
    if (activeSim) startSim(activeSim);
  };

  const stopSim = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    setActiveSim(null);
    setProgress(0);
    setIsPaused(false);
    setIsDownloading(false);
    setActiveThreatId(null);
  };

  const handleDownload = () => {
    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }

    // Database Effects mapped from UI timeline explicitly
    const runSupabaseEffects = async () => {
      if (!activeSim) return;
      const sim = simulations.find(s => s.id === activeSim);
      if (!sim) return;

      const deviceId = targetDeviceRef.current;
      const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(deviceId);
      
      // We build a robust filter: match by exact ID if it's a UUID, OR always search by name for 'Motor'
      // to ensure the ESP32-Motor-Sensor is caught correctly in the DB.
      const orFilter = isUuid ? `id.eq.${deviceId},name.ilike.%Motor%` : `name.ilike.%Motor%`;

      try {
        if (progress === 1) {
           await supabase.from('devices').update({ risk_score: 40, status: 'warning' }).or(orFilter);
        } else if (progress === 20) {
           await supabase.from('devices').update({ risk_score: 85 }).or(orFilter);
        } else if (progress === 40) {
           await supabase.from('devices').update({ risk_score: 95, status: 'isolated' }).or(orFilter);
           const { data } = await supabase.from('threats').insert([{
             name: `[Simulated Alert] ${sim.name}`,
             severity: sim.severity,
             status: 'active',
             target: deviceId,
             description: `AI Detoction triggered. ${sim.description}`,
             source: 'Aegis AI Defense System'
           }]).select();
           if (data && data.length > 0) setActiveThreatId(data[0].id);
        } else if (progress === 100) {
           // We explicitly leave the device isolated and the threat active,
           // requiring the user to manually mitigate and restore the device via the UI!
           setActiveThreatId(null);
        }
      } catch (e) {
        console.error("Simulation DB effect error:", e);
      }
    };
    
    runSupabaseEffects();

  }, [progress, activeSim]);

  const currentDetails = activeSim ? simDetails[activeSim] : null;

  return (
    <div className="space-y-10 pb-20 max-w-[1400px] mx-auto px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-2xl md:text-[32px] font-bold tracking-tight text-white mb-1 font-headline uppercase">Attack Simulation</h2>
          <p className="text-text-muted font-black text-[10px] uppercase tracking-[0.3em] font-label">Test your IIoT defenses with controlled cyberattack scenarios.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-danger/10 rounded-xl border border-danger/20">
            <div className="w-2 h-2 bg-danger rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]" />
            <span className="text-[9px] md:text-[10px] text-danger uppercase font-bold tracking-widest">Simulation Mode Active</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className={cn("lg:col-span-1 space-y-4", activeSim && "hidden lg:block")}>
          <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4 font-label">Available Scenarios</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {simulations.map((sim) => (
              <motion.div
                key={sim.id}
                whileHover={{ x: 4 }}
                className={cn(
                  "p-4 md:p-5 rounded-2xl border transition-all cursor-pointer group",
                  activeSim === sim.id 
                    ? "bg-danger/10 border-danger/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]" 
                    : "bg-bg-secondary/30 border-white/[0.06] hover:border-white/10"
                )}
                onClick={() => startSim(sim.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                      sim.severity === "critical" ? "bg-danger/10 text-danger shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "bg-warning/10 text-warning"
                    )}>
                      <Zap className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-danger transition-colors font-headline uppercase italic">{sim.name}</h4>
                  </div>
                </div>
                <p className="text-[11px] md:text-xs text-text-secondary leading-relaxed line-clamp-2 font-medium">{sim.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div ref={detailsRef} className={cn("lg:col-span-2", !activeSim && "hidden lg:block")}>
          <div className="glass-card p-4 md:p-8 h-full relative overflow-hidden flex flex-col min-h-[400px]">
            {!activeSim ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 md:space-y-8 py-10 md:py-20">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-bg-secondary/50 rounded-full flex items-center justify-center border border-white/[0.06]">
                  <Play className="w-8 h-8 md:w-10 md:h-10 text-text-muted" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3">Select a Scenario to Begin</h3>
                  <p className="text-xs md:text-sm text-text-secondary max-w-sm mx-auto font-medium">Choose an attack simulation from the list to test your system's autonomous response and zero-trust policies.</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-8 md:mb-12">
                  <div>
                    <div className="flex items-center gap-3 mb-4 lg:hidden">
                      <button 
                        onClick={() => stopSim()}
                        className="flex items-center gap-2 text-[10px] font-black text-danger uppercase tracking-widest bg-danger/10 px-3 py-1.5 rounded-lg border border-danger/20"
                      >
                         <RotateCcw className="w-4 h-4 rotate-180" />
                         Back to Scenarios
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-3">
                      <span className="px-2 py-0.5 rounded bg-danger/20 text-danger border border-danger/30 text-[8px] md:text-[9px] font-bold uppercase tracking-widest">Active Simulation</span>
                      {(() => {
                        const sim = simulations.find(s => s.id === activeSim);
                        return (
                          <>
                            <span className="text-[8px] md:text-[9px] text-text-muted uppercase tracking-widest font-bold">Scenario: {sim?.name}</span>
                            <span className="text-[8px] md:text-accent-blue uppercase tracking-widest font-bold border border-accent-blue/20 px-2 py-0.5 rounded bg-accent-blue/5">MITRE: {sim?.mitreTechnique}</span>
                          </>
                        );
                      })()}
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white font-headline uppercase italic">Execution Progress</h3>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button 
                      onClick={togglePause}
                      className={cn(
                        "flex-1 sm:flex-none p-2.5 md:p-3 bg-bg-secondary/50 hover:bg-bg-secondary/70 rounded-xl border border-white/[0.06] transition-all",
                        isPaused ? "text-success border-success/20 bg-success/5" : "text-text-muted hover:text-text-primary"
                      )}
                    >
                      {isPaused ? <Play className="w-4 h-4 md:w-5 md:h-5" /> : <Pause className="w-4 h-4 md:w-5 md:h-5" />}
                    </button>
                    <button 
                      onClick={resetSim}
                      className="flex-1 sm:flex-none p-2.5 md:p-3 bg-bg-secondary/50 hover:bg-bg-secondary/70 text-text-muted hover:text-text-primary rounded-xl border border-white/[0.06] transition-all"
                    >
                      <RotateCcw className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                    <button 
                      onClick={stopSim}
                      className="flex-1 sm:flex-none p-2.5 md:p-3 bg-danger/10 hover:bg-danger/20 text-danger rounded-xl border border-danger/20 transition-all"
                    >
                      <RotateCcw className="w-4 h-4 md:w-5 md:h-5 rotate-45" />
                    </button>
                  </div>
                </div>

                <div className="space-y-8 md:space-y-12 flex-1">
                  <div className="space-y-4">
                    <div className="flex justify-between text-[9px] md:text-[10px] font-black font-label">
                      <span className="text-text-muted uppercase tracking-[0.2em]">Attack Vector Deployment</span>
                      <span className="text-danger uppercase tracking-[0.2em]">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-bg-secondary/50 rounded-full overflow-hidden border border-white/[0.06]">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-danger to-warning shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                    <div className="bg-bg-secondary/30 border border-white/[0.06] p-4 md:p-6 rounded-2xl">
                      <div className="flex items-center gap-3 mb-4 md:mb-6">
                        <Target className="w-4 h-4 md:w-5 md:h-5 text-danger" />
                        <h4 className="text-[9px] md:text-[10px] font-bold text-text-primary uppercase tracking-widest">Attack Impact</h4>
                      </div>
                      <div className="space-y-3 md:space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] md:text-[10px] text-text-muted uppercase font-bold tracking-widest">Latency Spike</span>
                          <span className="text-xs text-danger font-mono font-bold">+{progress * 2}ms</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] md:text-[10px] text-text-muted uppercase font-bold tracking-widest">Packet Loss</span>
                          <span className="text-xs text-danger font-mono font-bold">{Math.floor(progress / 10)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] md:text-[10px] text-text-muted uppercase font-bold tracking-widest">CPU Load</span>
                          <span className="text-xs text-danger font-mono font-bold">{40 + Math.floor(progress / 2)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-accent-blue/5 border border-accent-blue/10 p-4 md:p-6 rounded-2xl">
                      <div className="flex items-center gap-3 mb-4 md:mb-6">
                        <Activity className="w-4 h-4 md:w-5 md:h-5 text-accent-blue" />
                        <h4 className="text-[9px] md:text-[10px] font-bold text-text-primary uppercase tracking-widest">Self-Healing Response</h4>
                      </div>
                      <div className="space-y-3 md:space-y-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-1.5 h-1.5 md:w-2 md:h-2 rounded-full", progress > 20 ? "bg-success shadow-[0_0_10px_rgba(34,197,94,0.4)]" : "bg-white/10")} />
                          <span className={cn("text-[9px] md:text-[10px] uppercase font-bold tracking-widest", progress > 20 ? "text-text-primary" : "text-text-muted")}>Anomaly Detected</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={cn("w-1.5 h-1.5 md:w-2 md:h-2 rounded-full", progress > 40 ? "bg-success shadow-[0_0_10px_rgba(34,197,94,0.4)]" : "bg-white/10")} />
                          <span className={cn("text-[9px] md:text-[10px] uppercase font-bold tracking-widest", progress > 40 ? "text-text-primary" : "text-text-muted")}>Traffic Throttling Active</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className={cn("w-1.5 h-1.5 md:w-2 md:h-2 rounded-full", progress > 70 ? "bg-success shadow-[0_0_10px_rgba(34,197,94,0.4)]" : "bg-white/10")} />
                          <span className={cn("text-[9px] md:text-[10px] uppercase font-bold tracking-widest", progress > 70 ? "text-text-primary" : "text-text-muted")}>Dynamic Policy Enforcement</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div ref={terminalRef} className="bg-[#0A0A0A] border border-white/[0.06] rounded-2xl p-4 font-mono text-[10px] md:text-xs h-[150px] overflow-y-auto custom-scrollbar">
                    {currentDetails?.logs.map((log, index) => (
                      progress >= log.p && (
                        <motion.div 
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={cn("mb-1", log.color)}
                        >
                          {log.text}
                        </motion.div>
                      )
                    ))}
                    {progress < 100 && !isPaused && <div className="animate-pulse text-text-muted mt-1">_</div>}
                  </div>

                  <div className="bg-accent-blue/5 border border-accent-blue/10 p-4 md:p-6 rounded-2xl flex items-start gap-4">
                    <Info className="w-4 h-4 md:w-5 md:h-5 text-accent-blue shrink-0 mt-0.5" />
                    <p className="text-[11px] md:text-xs text-text-secondary leading-relaxed font-medium">
                      <span className="text-text-primary font-bold">AI Insight:</span> {currentDetails?.insight}
                    </p>
                  </div>

                  <AnimatePresence>
                    {progress === 100 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex justify-end"
                      >
                        <button 
                          onClick={handleDownload}
                          disabled={isDownloading}
                          className="flex items-center gap-2 px-4 py-2 bg-success/10 hover:bg-success/20 text-success rounded-xl border border-success/20 transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDownloading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-success/30 border-t-success rounded-full animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              Download Report
                            </>
                          )}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
