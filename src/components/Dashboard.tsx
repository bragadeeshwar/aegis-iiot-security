import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  LineChart,
  Line
} from "recharts";
import { 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Cpu, 
  ArrowUpRight, 
  ArrowDownRight,
  Zap,
  Network,
  Brain
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import NeuralEngine from "./NeuralEngine";
import { devices as initialDevices, threats as initialThreats } from "../mockData";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";
import { mapDevice, mapDevices, mapThreat, mapThreats } from "../lib/supabaseMapper";

const initialChartData = [
  { name: "00:00", threats: 2, traffic: 400 },
  { name: "04:00", threats: 1, traffic: 300 },
  { name: "08:00", threats: 5, traffic: 800 },
  { name: "12:00", threats: 3, traffic: 600 },
  { name: "16:00", threats: 8, traffic: 1200 },
  { name: "20:00", threats: 4, traffic: 900 },
];

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color, isIsolated }: any) => (
  <motion.div 
    className={cn(
      "glass-card p-4 md:p-6 relative overflow-hidden group border-t-2 transition-all duration-500",
      isIsolated && "border-danger bg-danger/5 shadow-[0_0_20px_rgba(239,68,68,0.2)] animate-pulse"
    )}
    style={{ borderTopColor: isIsolated ? "#EF4444" : color === "blue" ? "rgba(0, 251, 251, 0.4)" : color === "red" ? "rgba(255, 180, 171, 0.4)" : color === "green" ? "rgba(0, 221, 221, 0.4)" : "rgba(255, 170, 247, 0.4)" }}
  >
    <div className="flex justify-between items-start mb-3 md:mb-4 relative z-10">
      <p className="text-text-muted text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] font-label">{title}</p>
      {!isIsolated && (
        <div className={cn(
          "flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[9px] md:text-[10px] font-bold transition-colors",
          trend === "up" ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
        )}>
          {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {trendValue}
        </div>
      )}
      {isIsolated && (
        <div className="bg-danger/20 text-danger px-1.5 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-tight">
          Kill-Switch Active
        </div>
      )}
    </div>
    
    <div className="flex items-end justify-between relative z-10">
      <motion.h4 
        key={value}
        initial={{ opacity: 0.5, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "text-[18px] md:text-[24px] font-bold tracking-tighter leading-none font-headline uppercase",
          isIsolated ? "text-danger" : "text-white"
        )}
      >
        {isIsolated ? "SHUTDOWN" : value}
      </motion.h4>
      <div className={cn(
        "p-1.5 md:p-2 rounded-lg bg-white/5 border border-white/10",
        isIsolated ? "text-danger glow-danger animate-bounce" :
        color === "blue" ? "text-accent-blue glow-blue" : 
        color === "red" ? "text-danger" : 
        color === "green" ? "text-success" : "text-accent-purple glow-purple"
      )}>
        <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
      </div>
    </div>
  </motion.div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [chartData, setChartData] = useState(initialChartData);
  const [liveDevices, setLiveDevices] = useState<any[]>([]);
  const [liveThreats, setLiveThreats] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [systemLoad, setSystemLoad] = useState(24);
  const [trustScore, setTrustScore] = useState(94.2);
  const [networkLive, setNetworkLive] = useState(true);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [latestTelemetry, setLatestTelemetry] = useState({
    temperature: 0,
    vibration: 0,
    current: 0,
    motor_status: "stopped"
  });

  const isKeyPlaceholder = import.meta.env.VITE_SUPABASE_ANON_KEY?.includes("YOUR_CLOUD");

  useEffect(() => {
    // UI Motion for dashboard demo effect
    const interval = setInterval(() => {
      setSystemLoad(prev => Math.max(10, Math.min(95, prev + (Math.random() * 10 - 5))));
      setTrustScore(prev => Math.max(80, Math.min(99.9, prev + (Math.random() * 2 - 1))));
      
      // If not connected, animate some mock telemetry
      if (!isCloudConnected) {
        setLatestTelemetry(prev => ({
          ...prev,
          temperature: 45 + Math.random() * 10,
          vibration: 0.2 + Math.random() * 0.5,
          current: 12 + Math.random() * 4
        }));
      }
    }, 3000);

    const checkCloudConnection = async () => {
      if (!isSupabaseConfigured) {
        setIsCloudConnected(false);
        return;
      }

      try {
        const { data, error } = await supabase.from('iot_telemetry').select('*').limit(1);
        if (error) throw error;
        setIsCloudConnected(true);
      } catch (e) {
        console.warn("Cloud connection check failed, using simulation mode.");
        setIsCloudConnected(false);
      }
    };

    checkCloudConnection();

    const fetchInitialData = async () => {
      // Bail out early if not configured
      if (!isSupabaseConfigured) {
        setLiveDevices(initialDevices);
        setLiveThreats(initialThreats);
        setIsDataLoading(false);
        return;
      }

      try {
        // Fetch devices
        const { data: deviceData, error: deviceError } = await supabase
          .from('devices')
          .select('*');
        if (!deviceError && deviceData) setLiveDevices(mapDevices(deviceData));
        else setLiveDevices(initialDevices);

        // Fetch threats
        const { data: threatData, error: threatError } = await supabase
          .from('threats')
          .select('*')
          .order('timestamp', { ascending: false });
        if (!threatError && threatData) setLiveThreats(mapThreats(threatData));
        else setLiveThreats(initialThreats);

        // Fetch telemetry
        const { data: telemetryData, error: telemetryError } = await supabase
          .from('iot_telemetry')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(1);
        
        if (!telemetryError && telemetryData && telemetryData.length > 0) {
          setLatestTelemetry({
            temperature: telemetryData[0].temperature,
            vibration: telemetryData[0].vibration,
            current: telemetryData[0].current,
            motor_status: telemetryData[0].motor_status
          });
        }
      } catch (e) {
        console.warn("Initial data fetch failed:", e);
        setLiveDevices(initialDevices);
        setLiveThreats(initialThreats);
      } finally {
        setIsDataLoading(false);
      }
    };

    if (!isKeyPlaceholder) fetchInitialData();
    else {
      setLiveDevices(initialDevices);
      setLiveThreats(initialThreats);
      setIsDataLoading(false);
    }

    // Subscribe to everything
    const deviceSub = supabase.channel('dashboard-devices').on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, payload => {
       if (payload.eventType === 'INSERT') setLiveDevices(prev => [...prev, mapDevice(payload.new)]);
       else if (payload.eventType === 'UPDATE') setLiveDevices(prev => prev.map(d => String(d.id) === String(payload.new.id) ? mapDevice(payload.new) : d));
       else if (payload.eventType === 'DELETE') setLiveDevices(prev => prev.filter(d => String(d.id) !== String(payload.old.id)));
    }).subscribe();

    const threatSub = supabase.channel('dashboard-threats').on('postgres_changes', { event: '*', schema: 'public', table: 'threats' }, payload => {
       if (payload.eventType === 'INSERT') setLiveThreats(prev => [mapThreat(payload.new as any), ...prev]);
       else if (payload.eventType === 'UPDATE') setLiveThreats(prev => prev.map(t => String(t.id) === String(payload.new.id) ? mapThreat(payload.new as any) : t));
       else if (payload.eventType === 'DELETE') setLiveThreats(prev => prev.filter(t => String(t.id) !== String(payload.old.id)));
    }).subscribe();

    // Telemetry subscription
    const telemetrySub = supabase.channel('dashboard-telemetry').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'iot_telemetry' }, payload => {
       const newData = payload.new as any;
       setLatestTelemetry({
          temperature: newData.temperature,
          vibration: newData.vibration,
          current: newData.current,
          motor_status: newData.motor_status
       });
       // Update traffic chart
       setChartData(prev => {
         const updated = [...prev.slice(1)];
         updated.push({
           name: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
           threats: newData.is_anomaly ? 10 : 0,
           traffic: newData.motor_status === 'running' ? 800 : 300
         });
         return updated;
       });
    }).subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(deviceSub);
      supabase.removeChannel(threatSub);
      supabase.removeChannel(telemetrySub);
    };
  }, [isCloudConnected]);

  return (
    <div className="space-y-6 md:space-y-10 pb-10 px-4 md:px-8">
      {/* Top Banner / Pulse */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
         <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1 font-headline uppercase italic">Operational Overview</h2>
            <p className="text-[10px] text-text-muted uppercase tracking-[0.3em] font-black font-label">Secure Industrial Environment Node 01</p>
         </div>
         <div className="flex items-center gap-3 bg-white/[0.03] px-4 py-2 rounded-xl border border-white/5 backdrop-blur-md">
            <div className={cn("w-1.5 h-1.5 md:w-2 md:h-2 rounded-full", isCloudConnected ? "bg-success glow-green animate-pulse" : "bg-accent-blue/40 animate-pulse")} />
            <span className={cn("text-[9px] uppercase font-black tracking-[0.2em] font-label", isCloudConnected ? "text-success" : "text-accent-blue/60")}>
               {isCloudConnected ? "Cloud Sync: Active" : "Edge Simulation: Running"}
            </span>
         </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard 
          title="Total Devices" 
          value={liveDevices.length} 
          icon={Cpu} 
          trend="up" 
          trendValue="+2.5%" 
          color="blue"
        />
        <StatCard 
          title="Active Threats" 
          value={liveThreats.filter(t => t.status === "active").length} 
          icon={ShieldAlert} 
          trend={liveThreats.length > 3 ? "up" : "down"} 
          trendValue={liveThreats.length > 3 ? "+5%" : "-12%"} 
          color="red"
        />
        <StatCard 
          title="Trust Score" 
          value={trustScore.toFixed(1)} 
          icon={ShieldCheck} 
          trend={trustScore > 90 ? "up" : "down"} 
          trendValue={trustScore > 90 ? "+0.8%" : "-1.2%"} 
          color="green"
        />
        <StatCard 
          title="Motor 1 Status" 
          value={latestTelemetry.motor_status.toUpperCase()} 
          icon={Activity} 
          trend={latestTelemetry.motor_status === "running" ? "up" : "down"} 
          trendValue={latestTelemetry.vibration.toFixed(2) + "g"} 
          color={latestTelemetry.motor_status === "running" ? "green" : latestTelemetry.motor_status === "isolated" ? "red" : "blue"}
          isIsolated={latestTelemetry.motor_status === "isolated"}
        />
      </div>


      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Main Graph Card (70%) */}
        <div className="lg:col-span-7 glass-card p-4 md:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h3 className="text-base md:text-[18px] font-bold text-white font-headline tracking-tight uppercase">Network Traffic & Threats</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent-blue rounded-full glow-blue" />
                <span className="text-[9px] md:text-[10px] text-text-secondary uppercase font-black tracking-[0.2em] font-label">Traffic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-danger rounded-full" />
                <span className="text-[9px] md:text-[10px] text-text-secondary uppercase font-black tracking-[0.2em] font-label">Threats</span>
              </div>
            </div>
          </div>
          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ left: -20, right: 10 }}>
                <defs>
                  <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00fbfb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00fbfb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#ffffff10" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                  tick={{ fill: '#A1A8B8' }}
                />
                <YAxis 
                  yAxisId="left"
                  stroke="#ffffff10" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false} 
                  dx={-10}
                  tick={{ fill: '#A1A8B8' }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="#ffffff10" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false} 
                  dx={10}
                  tick={{ fill: '#EF4444' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 22, 41, 0.9)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="traffic" 
                  stroke="#00fbfb" 
                  fillOpacity={1} 
                  fill="url(#colorTraffic)" 
                  strokeWidth={2}
                  style={{ filter: 'url(#glowBlue)' }}
                  isAnimationActive={true}
                  animationDuration={500}
                />
                <Area 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="threats" 
                  stroke="#ffb4ab" 
                  fillOpacity={0.1} 
                  fill="#ffb4ab" 
                  strokeWidth={2}
                  isAnimationActive={true}
                  animationDuration={500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts Panel (30%) */}
        <div className="lg:col-span-3 glass-card p-4 md:p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base md:text-[18px] font-bold text-white font-headline tracking-tight uppercase">Security Alerts</h3>
            <div className="px-2 py-0.5 rounded bg-danger/10 border border-danger/20 text-[8px] font-bold text-danger animate-pulse uppercase tracking-widest">Live</div>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[400px] lg:max-h-none">
            {liveThreats.length === 0 && (
              <div className="py-10 text-center">
                <ShieldCheck className="w-8 h-8 text-success/30 mx-auto mb-2" />
                <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">No active threats detected</p>
              </div>
            )}
            {liveThreats.slice(0, 6).map((threat) => (
              <motion.div 
                key={threat.id} 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: 4 }}
                onClick={() => navigate("/threats")}
                className={cn(
                  "p-3 rounded-xl bg-white/[0.02] border-l-4 transition-all hover:bg-white/[0.06] cursor-pointer group",
                  threat.severity === "critical" ? "border-danger bg-danger/5" : 
                  threat.severity === "high" ? "border-warning bg-warning/5" : "border-accent-blue bg-accent-blue/5"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="text-[12px] md:text-[13px] font-bold text-[#E6EAF2] group-hover:text-white transition-colors">{threat.name}</p>
                  <span className="text-[8px] md:text-[9px] text-text-muted font-mono font-bold">{threat.timestamp.split(' ').pop()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[9px] text-text-secondary uppercase tracking-[0.1em] font-black">{threat.severity}</p>
                  <Zap className="w-3 h-3 text-text-muted group-hover:text-accent-blue transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
          <button 
            onClick={() => navigate("/threats")}
            className="w-full mt-4 py-3 text-[10px] md:text-[11px] font-black text-text-muted hover:text-accent-blue hover:bg-white/5 rounded-xl uppercase tracking-[0.3em] transition-all border border-white/5 font-label"
          >
            Access Threat Center
          </button>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mini Network Map (50%) */}
        <div className="glass-card p-6 h-[300px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[18px] font-semibold text-[#E6EAF2]">Network Topology</h3>
            <button 
              onClick={() => setNetworkLive(!networkLive)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
            >
              <div className={cn("w-2 h-2 rounded-full", networkLive ? "bg-success glow-green animate-pulse" : "bg-text-muted")} />
              <span className={cn("text-[10px] uppercase font-bold tracking-widest", networkLive ? "text-success" : "text-text-muted")}>
                {networkLive ? "Live" : "Offline"}
              </span>
            </button>
          </div>
          <div className="flex-1 bg-black/20 rounded-xl border border-white/5 relative overflow-hidden cursor-pointer group" onClick={() => navigate("/network")}>
             <div className="absolute inset-0 cyber-grid opacity-10" />
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full">
                  {/* Central Gateway */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center border border-accent-blue/30 relative">
                      <Zap className="w-4 h-4 text-accent-blue" />
                      <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -inset-2 rounded-full border border-accent-blue/30" 
                      />
                    </div>
                  </div>

                  {/* Nodes */}
                  {[
                    { t: "20%", l: "30%", c: "accent-blue" },
                    { t: "25%", l: "70%", c: "accent-purple" },
                    { t: "70%", l: "25%", c: "success" },
                    { t: "75%", l: "75%", c: "warning" },
                    { t: "40%", l: "15%", c: "accent-blue" },
                    { t: "60%", l: "85%", c: "accent-purple" }
                  ].map((node, i) => (
                    <React.Fragment key={i}>
                      <motion.div 
                        animate={{ 
                          scale: [1, 1.2, 1],
                          opacity: networkLive ? [0.4, 1, 0.4] : 0.2
                        }}
                        transition={{ duration: 2 + i, repeat: Infinity, delay: i * 0.5 }}
                        className={cn(
                          "absolute w-3 h-3 rounded-full border border-white/10 z-10",
                          networkLive ? `bg-${node.c} shadow-[0_0_10px_rgba(0,0,0,0.5)]` : "bg-text-muted/30"
                        )}
                        style={{ top: node.t, left: node.l }}
                      />
                      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                        <motion.line 
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: networkLive ? 1 : 0 }}
                          transition={{ duration: 1.5, delay: i * 0.2 }}
                          x1={node.l} y1={node.t} 
                          x2="50%" y2="50%" 
                          stroke={networkLive ? "white" : "rgba(255,255,255,0.1)"} 
                          strokeWidth="0.5" 
                        />
                      </svg>
                    </React.Fragment>
                  ))}
                </div>
             </div>
             
             {!networkLive && (
               <div className="absolute inset-0 flex items-center justify-center bg-bg-primary/40 backdrop-blur-[2px] z-30">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] bg-bg-secondary/80 px-3 py-1 rounded-lg border border-white/5">Offline</p>
               </div>
             )}
             
             <div className="absolute bottom-2 right-2 z-40 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-[8px] font-black text-accent-blue uppercase tracking-widest bg-accent-blue/10 px-2 py-1 rounded border border-accent-blue/20">Full Topology →</button>
             </div>
          </div>
        </div>

        {/* Device Status (50%) */}
        <div className="glass-card p-4 md:p-6 h-[400px] lg:h-[300px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base md:text-[18px] font-bold text-white font-headline tracking-tight uppercase">Device Status</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-[9px] text-text-muted uppercase font-black tracking-widest">{liveDevices.filter(d => d.status === 'online').length} Online</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {liveDevices.slice(0, 9).map((device) => (
              <motion.div 
                key={device.id}
                layout
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex flex-col items-center justify-center text-center group transition-all"
              >
                <div className={cn(
                  "w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-2 transition-all group-hover:rotate-12",
                  device.status === "online" ? "bg-success/10 text-success shadow-[0_0_15px_rgba(34,197,94,0.15)]" : 
                  device.status === "warning" ? "bg-warning/10 text-warning shadow-[0_0_15px_rgba(234,179,8,0.15)]" : "bg-danger/10 text-danger shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                )}>
                  <Cpu className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <p className="text-[10px] md:text-[11px] font-bold text-[#E6EAF2] truncate w-full">{device.name}</p>
                <div className="flex flex-col gap-0.5 mt-1">
                  <p className="text-[9px] text-accent-blue font-mono font-bold tracking-tight">{device.ip}</p>
                  <p className="text-[8px] text-text-muted uppercase tracking-widest font-black opacity-60">{device.type}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Neural Reasoning Row */}
      <div className="mt-8">
         <NeuralEngine telemetry={latestTelemetry} threats={liveThreats} />
      </div>
    </div>
  );
}
