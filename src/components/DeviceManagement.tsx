import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  ShieldOff,
  Cpu,
  MapPin,
  Activity,
  ArrowRight,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabaseClient";
import { cn } from "../lib/utils";
import { DeviceStatus } from "../types";
import { devices as initialDevices } from "../mockData";
import { mapDevice, mapDevices } from "../lib/supabaseMapper";

const StatusBadge = ({ status }: { status: DeviceStatus }) => {
  const styles = {
    online: "bg-success/10 text-success border-success/20 shadow-[0_0_10px_rgba(34,197,94,0.05)]",
    offline: "bg-white/5 text-text-muted border-white/10",
    isolated: "bg-danger/10 text-danger border-danger/20 shadow-[0_0_10px_rgba(239,68,68,0.05)]",
    warning: "bg-warning/10 text-warning border-warning/20 shadow-[0_0_10px_rgba(245,158,11,0.05)]",
  };

  const icons = {
    online: ShieldCheck,
    offline: ShieldOff,
    isolated: Shield,
    warning: ShieldAlert,
  };

  const Icon = icons[status];

  return (
    <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase tracking-widest transition-colors", styles[status])}>
      <Icon className="w-3 h-3" />
      {status}
    </div>
  );
};

export default function DeviceManagement() {
  const [devicesList, setDevicesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | "all">("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<typeof initialDevices[0] | null>(null);
  const [modalType, setModalType] = useState<"details" | "logs" | null>(null);

  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Initial Fetch & Real-time subscription
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const { data, error } = await supabase
          .from('devices')
          .select('*')
          .order('name');
        
        if (error) throw error;
        if (data) setDevicesList(mapDevices(data));
        setConnectionError(null);
      } catch (err: any) {
        console.error("Error fetching devices:", err);
        setConnectionError(`Supabase Connection Failed: ${err.message || JSON.stringify(err)}`);
        // Fallback to initialDevices if fetch fails
        setDevicesList(initialDevices);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevices();

    const subscription = supabase
      .channel('devices-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devices' },
        (payload) => {
          console.log("🛡️ Aegis Realtime Sync:", payload.eventType, payload.new);
          if (payload.eventType === 'INSERT') {
            setDevicesList(prev => [...prev, mapDevice(payload.new)]);
          } else if (payload.eventType === 'UPDATE') {
            setDevicesList(prev => prev.map(d => 
              d.id === String(payload.new.id) ? mapDevice(payload.new) : d
            ));
          } else if (payload.eventType === 'DELETE') {
            setDevicesList(prev => prev.filter(d => d.id !== String(payload.old.id)));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Live simulation engine to make the dashboard feel real-time
  useEffect(() => {
    const simulationInterval = setInterval(() => {
      setDevicesList(currentDevices => {
        if (currentDevices.length === 0) return currentDevices;
        
        // Pick a random device to update
        const randomIndex = Math.floor(Math.random() * currentDevices.length);
        const newDevices = [...currentDevices];
        const device = { ...newDevices[randomIndex] };

        // Do not simulate activity on offline or isolated devices.
        // For offline devices, forcefully ensure risk score is 100 on the client.
        if (device.status === 'offline') {
           device.riskScore = 100;
           newDevices[randomIndex] = device;
           return newDevices;
        }
        if (device.status === 'isolated') {
           return currentDevices;
        }

        // Prevent simulating logic for the actual hardware
        if (device.id === 'ESP32-Motor-Sensor' || device.name.toLowerCase().includes('motor')) {
           return currentDevices; 
        }
        
        // Randomly adjust risk score
        const scoreChange = Math.floor(Math.random() * 5) - 2; // -2 to +2
        device.riskScore = Math.min(100, Math.max(0, (device.riskScore || 10) + scoreChange));
        
        // Occasionally flip status between online and warning if score is high
        if (device.riskScore > 40 && Math.random() > 0.8) {
          device.status = device.status === 'online' ? 'warning' : 'online';
        }
        
        newDevices[randomIndex] = device;
        return newDevices;
      });
    }, 4000); // Update every 4 seconds

    return () => clearInterval(simulationInterval);
  }, []);
  const checkIPReputation = async (ip: string) => {
  try {
    // This calls your deployed Edge Function
    const { data, error } = await supabase.functions.invoke('vt-checker', {
      body: { ip: ip }
    });

    if (error) throw error;

    if (data.is_malicious) {
      console.error("🚨 ALERT: Device communicating with malicious IP!");
      alert("WARNING: This device is communicating with a known malicious IP address.");
      // You could trigger your handleIsolate() function here automatically!
    } else {
      console.log("✅ IP is safe.");
    }
  } catch (err) {
    console.error("Error checking IP reputation:", err);
  }
};
  const filteredDevices = devicesList.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.ip.includes(searchTerm) ||
      d.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleIsolate = async (id: string) => {
    setDevicesList(prev => prev.map(d => d.id === id ? { ...d, status: 'isolated' as DeviceStatus } : d));
    setOpenMenuId(null);
    try {
      await supabase.from('devices').update({ status: 'isolated', risk_score: 80 }).eq('id', id);
    } catch (e) { console.error('Failed to isolate device in cloud'); }
  };

  const handleRestore = async (id: string) => {
    setDevicesList(prev => prev.map(d => d.id === id ? { ...d, status: 'online' as DeviceStatus, riskScore: 0 } : d));
    setOpenMenuId(null);
    try {
      await supabase.from('devices').update({ status: 'online', risk_score: 0 }).eq('id', id);
    } catch (e) { console.error('Failed to restore device in cloud'); }
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-20 max-w-[1400px] mx-auto px-4 md:px-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-[32px] font-bold tracking-tight text-white mb-1 font-headline uppercase italic">Device Inventory</h2>
          <p className="text-text-muted font-black text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-label">Manage and monitor all connected IIoT assets.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative group flex-1 sm:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent-blue transition-colors" />
            <input 
              type="text" 
              placeholder="Filter devices..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-bg-secondary/50 border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/30 transition-all w-full sm:w-64"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 custom-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {(["all", "online", "warning", "isolated", "offline"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border font-label shrink-0",
                  statusFilter === status 
                    ? "bg-accent-blue/10 border-accent-blue/30 text-accent-blue shadow-[0_0_15px_rgba(0,251,251,0.1)]" 
                    : "bg-bg-secondary/50 border-white/5 text-text-muted hover:text-text-primary"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {connectionError && (
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-start gap-4 mb-4">
          <div className="p-2 bg-danger/20 rounded-lg shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-danger font-headline uppercase">Cloud Database Connection Error</h4>
            <p className="text-xs text-danger/80 mt-1">{connectionError}</p>
            <p className="text-xs text-danger/80 mt-2 font-bold">Try restarting your terminal (npm run dev) so Vite can load the new .env.local file!</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className="w-10 h-10 border-4 border-accent-blue/10 border-t-accent-blue rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-bold text-accent-blue uppercase tracking-widest animate-pulse font-label">Synchronizing Assets...</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.01] font-label">
                  <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Device Name</th>
                  <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Type</th>
                  <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Risk Score</th>
                  <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">IP Address</th>
                  <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Location</th>
                  <th className="px-8 py-5 text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                <AnimatePresence mode="popLayout">
                  {filteredDevices.map((device) => (
                    <motion.tr 
                      key={device.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => {
                        setSelectedDevice(device);
                        setModalType("details");
                      }}
                      className="group hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-accent-blue/5 border border-accent-blue/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Cpu className="w-5 h-5 text-accent-blue" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-text-primary group-hover:text-accent-blue transition-colors">{device.name}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[10px] text-text-muted font-mono opacity-60">ID: {device.id}</span>
                              {device.lastSeen && (
                                <span className="text-[9px] text-text-muted font-mono opacity-50">• {device.lastSeen}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs text-text-secondary font-medium">{device.type}</span>
                      </td>
                      <td className="px-8 py-5">
                        <StatusBadge status={device.status} />
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden w-24">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${device.riskScore}%` }}
                              className={cn(
                                "h-full rounded-full",
                                device.riskScore > 70 ? "bg-danger shadow-[0_0_8px_rgba(239,68,68,0.4)]" : 
                                device.riskScore > 30 ? "bg-warning shadow-[0_0_8px_rgba(245,158,11,0.4)]" : "bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                              )}
                            />
                          </div>
                          <span className={cn(
                            "text-xs font-mono font-bold",
                            device.riskScore > 70 ? "text-danger" : 
                            device.riskScore > 30 ? "text-warning" : "text-success"
                          )}>
                            {device.riskScore}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent-blue/60 shadow-[0_0_6px_rgba(0,251,251,0.5)]" />
                          <span className="text-xs font-mono font-bold text-accent-blue tracking-tight">{device.ip || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                          <MapPin className="w-3.5 h-3.5 text-text-muted" />
                          {device.location}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDevice(device);
                              setModalType("logs");
                            }}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-text-muted hover:text-text-primary"
                          >
                            <Activity className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDevice(device);
                              setModalType("details");
                            }}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-text-muted hover:text-text-primary"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                          <div className="relative">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === device.id ? null : device.id);
                              }}
                              className={cn(
                                "p-2 hover:bg-white/10 rounded-xl transition-colors text-text-muted hover:text-text-primary",
                                openMenuId === device.id && "bg-white/10 text-text-primary"
                              )}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            
                            <AnimatePresence>
                              {openMenuId === device.id && (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                  className="absolute right-0 mt-2 w-48 glass border border-glass-border rounded-2xl shadow-2xl z-50 overflow-hidden py-2"
                                >
                                  {device.status === 'isolated' ? (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRestore(device.id);
                                      }}
                                      className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-success hover:bg-success/10 transition-colors uppercase tracking-widest"
                                    >
                                      <ShieldCheck className="w-4 h-4" />
                                      Restore Device
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleIsolate(device.id);
                                      }}
                                      className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-danger hover:bg-danger/10 transition-colors uppercase tracking-widest"
                                    >
                                      <Shield className="w-4 h-4" />
                                      Isolate Device
                                    </button>
                                  )}
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedDevice(device);
                                      setModalType("logs");
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-text-secondary hover:bg-white/5 transition-colors uppercase tracking-widest"
                                  >
                                    <Activity className="w-4 h-4" />
                                    View Logs
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredDevices.map((device) => (
              <motion.div 
                key={device.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => {
                  setSelectedDevice(device);
                  setModalType("details");
                }}
                className="glass-card p-5 space-y-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent-blue/5 border border-accent-blue/10 flex items-center justify-center">
                      <Cpu className="w-5 h-5 text-accent-blue" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">{device.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-accent-blue font-mono font-bold">{device.ip || 'N/A'}</span>
                        {device.lastSeen && (
                          <span className="text-[9px] text-text-muted font-mono opacity-60">• {device.lastSeen}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={device.status} />
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                  <div>
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">Type</p>
                    <p className="text-xs text-text-secondary font-medium">{device.type}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">IP Address</p>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent-blue/60 shadow-[0_0_6px_rgba(0,251,251,0.5)]" />
                      <p className="text-xs font-mono font-bold text-accent-blue">{device.ip || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">Location</p>
                    <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                      <MapPin className="w-3.5 h-3.5 text-text-muted" />
                      {device.location}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-1">Risk Score</p>
                    <span className={cn(
                      "text-xs font-mono font-bold",
                      device.riskScore > 70 ? "text-danger" : 
                      device.riskScore > 30 ? "text-warning" : "text-success"
                    )}>
                      {device.riskScore}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDevice(device);
                        setModalType("logs");
                      }}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-text-muted hover:text-text-primary"
                    >
                      <Activity className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDevice(device);
                        setModalType("details");
                      }}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-text-muted hover:text-text-primary"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  {device.status === 'isolated' ? (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(device.id);
                      }}
                      className="px-4 py-2 bg-success/10 hover:bg-success/20 text-success text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all"
                    >
                      Restore
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleIsolate(device.id);
                      }}
                      className="px-4 py-2 bg-danger/10 hover:bg-danger/20 text-danger text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all"
                    >
                      Isolate
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
          
          {filteredDevices.length === 0 && !isLoading && (
            <div className="p-20 text-center">
              <p className="text-text-muted font-medium text-lg">No devices found matching your criteria.</p>
            </div>
          )}
          </>
        )}
        </div>

      {/* Modals */}
      <AnimatePresence>
        {modalType && selectedDevice && (
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
                    <Cpu className="w-6 h-6 text-accent-blue" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-headline uppercase">{selectedDevice.name}</h3>
                    <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.2em] font-label">{modalType === 'details' ? 'Device Details' : 'System Logs'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setModalType(null)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors text-text-muted hover:text-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalType === 'details' ? (
                <div className="space-y-6">
                  {/* Live Data Summary Bar */}
                  <div className="p-4 bg-accent-blue/5 border border-accent-blue/10 rounded-2xl flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-accent-blue/80 rounded-full shadow-[0_0_6px_rgba(0,251,251,0.6)]" />
                      <span className="text-xs font-mono font-bold text-accent-blue">{selectedDevice.ip || 'No IP'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted">
                      <span className="text-[10px] font-bold uppercase tracking-widest">{selectedDevice.type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted ml-auto">
                      <span className="text-[10px] font-mono opacity-70">{selectedDevice.location}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-bg-secondary/30 border border-white/[0.06] rounded-2xl space-y-1">
                      <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">IP Address</p>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-accent-blue/60 rounded-full shadow-[0_0_6px_rgba(0,251,251,0.5)]" />
                        <p className="text-sm text-accent-blue font-mono font-bold">{selectedDevice.ip || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-bg-secondary/30 border border-white/[0.06] rounded-2xl space-y-1">
                      <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Last Seen</p>
                      <p className="text-sm text-text-primary font-mono">{selectedDevice.lastSeen || '—'}</p>
                    </div>
                    <div className="p-4 bg-bg-secondary/30 border border-white/[0.06] rounded-2xl space-y-1">
                      <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Location</p>
                      <p className="text-sm text-text-primary">{selectedDevice.location || '—'}</p>
                    </div>
                    <div className="p-4 bg-bg-secondary/30 border border-white/[0.06] rounded-2xl space-y-1">
                      <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Risk Score</p>
                      <p className={cn(
                        "text-sm font-mono font-bold",
                        (selectedDevice.riskScore || 0) > 70 ? "text-danger" :
                        (selectedDevice.riskScore || 0) > 30 ? "text-warning" : "text-success"
                      )}>{selectedDevice.riskScore ?? '—'} / 100</p>
                    </div>
                  </div>

                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest mb-2">Security Posture</p>
                    <div className="flex items-center gap-3">
                      <ShieldCheck className={cn("w-5 h-5", (selectedDevice.riskScore || 0) > 70 ? "text-danger" : (selectedDevice.riskScore || 0) > 30 ? "text-warning" : "text-success")} />
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {(selectedDevice.riskScore || 0) > 70
                          ? "HIGH RISK: Device requires immediate attention. Isolate and audit."
                          : (selectedDevice.riskScore || 0) > 30
                          ? "MODERATE RISK: Monitor closely. Review access policies."
                          : "SECURE: Encryption active. No recent unauthorized access detected."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Historical Threat Alerts</h4>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                      {[
                        { time: "2024-03-20 14:22:05", alert: "Unauthorized Modbus Write Attempt", severity: "Critical" },
                        { time: "2024-03-18 09:15:33", alert: "Anomalous Traffic Spike", severity: "High" },
                        { time: "2024-03-15 11:40:12", alert: "Failed Authentication (3x)", severity: "Medium" },
                        { time: "2024-03-10 16:05:55", alert: "Port Scan Detected", severity: "Low" },
                      ].map((alert, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-bg-secondary/30 border border-white/[0.06] rounded-xl">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-text-primary">{alert.alert}</span>
                            <span className="text-[10px] text-text-muted font-mono">{alert.time}</span>
                          </div>
                          <span className={cn(
                            "px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border",
                            alert.severity === "Critical" ? "bg-danger/10 text-danger border-danger/20" :
                            alert.severity === "High" ? "bg-warning/10 text-warning border-warning/20" :
                            alert.severity === "Medium" ? "bg-accent-blue/10 text-accent-blue border-accent-blue/20" :
                            "bg-white/5 text-text-muted border-white/10"
                          )}>
                            {alert.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { time: "14:48:32", event: "Connection established", type: "info" },
                    { time: "14:45:12", event: "Heartbeat signal received", type: "info" },
                    { time: "14:30:05", event: "Firmware integrity check passed", type: "success" },
                    { time: "14:12:44", event: "Login attempt from 192.168.1.45", type: "warning" },
                    { time: "13:55:21", event: "System reboot initiated", type: "info" },
                  ].map((log, i) => (
                    <div key={i} className="flex gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-[10px] font-mono text-text-muted shrink-0">{log.time}</span>
                      <p className={cn(
                        "text-[11px] font-medium",
                        log.type === 'warning' ? "text-warning" : 
                        log.type === 'success' ? "text-success" : "text-text-secondary"
                      )}>{log.event}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setModalType(null)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-text-primary text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all"
                >
                  Close
                </button>
                {modalType === 'details' && (
                  <button 
                    onClick={() => setModalType(null)}
                    className="flex-1 py-3 bg-accent-blue text-white text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all glow-blue"
                  >
                    Edit Config
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
