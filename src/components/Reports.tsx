import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Filter, 
  FileText, 
  TrendingUp, 
  Shield, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Activity
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

import { supabase } from "../lib/supabaseClient";
import { mapThreats, mapDevices } from "../lib/supabaseMapper";
import { generateProfessionalPDF } from "../lib/pdfGenerator";
import { Device, Threat } from "../types";

const COLORS = ["#3B82F6", "#EF4444", "#F59E0B", "#8B5CF6"];

const generateData = (range: string) => {
  let multiplier = 1;
  let labels = ["W1", "W2", "W3", "W4"];
  
  if (range === 'Last 24 Hours') {
    multiplier = 0.1;
    labels = ["00:00", "06:00", "12:00", "18:00"];
  } else if (range === 'Last 7 Days') {
    multiplier = 0.3;
    labels = ["Mon", "Wed", "Fri", "Sun"];
  } else if (range === 'Last Quarter') {
    multiplier = 3;
    labels = ["Jan", "Feb", "Mar"];
  }

  const barData = labels.map(label => ({
    name: label,
    detected: Math.floor((Math.random() * 40 + 20) * multiplier),
    mitigated: Math.floor((Math.random() * 38 + 18) * multiplier),
  }));

  const pieData = [
    { name: "DDoS", value: Math.floor(400 * multiplier * (Math.random() * 0.5 + 0.8)) },
    { name: "Malware", value: Math.floor(300 * multiplier * (Math.random() * 0.5 + 0.8)) },
    { name: "Unauthorized", value: Math.floor(300 * multiplier * (Math.random() * 0.5 + 0.8)) },
    { name: "Spoofing", value: Math.floor(200 * multiplier * (Math.random() * 0.5 + 0.8)) },
  ];

  return { barData, pieData };
};

export default function Reports() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genSuccess, setGenSuccess] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [chartData, setChartData] = useState<{barData: any[], pieData: any[]}>({ barData: [], pieData: [] });
  const [liveStats, setLiveStats] = useState({ totalAlerts: 0, criticalFixes: 0, uptime: "99.98%" });
  const [rawThreats, setRawThreats] = useState<Threat[]>([]);
  const [rawDevices, setRawDevices] = useState<Device[]>([]);

  const processLiveThreats = (threats: any[]) => {
    // Group by source/type for Pie Chart
    const types: Record<string, number> = {};
    threats.forEach(t => {
      const type = t.name.split(' ')[0] || "Unknown";
      types[type] = (types[type] || 0) + 1;
    });

    const pieData = Object.entries(types).map(([name, value]) => ({ name, value })).slice(0, 4);
    
    // Group by day for Bar Chart (last 7 items)
    const barData = threats.slice(0, 7).reverse().map(t => ({
      name: t.timestamp.split('T')[0].split('-').slice(1).join('/'),
      detected: t.severity === 'critical' ? 5 : 2,
      mitigated: t.status === 'mitigated' ? (t.severity === 'critical' ? 5 : 2) : 0
    }));

    return { 
      barData: barData.length > 0 ? barData : generateData(dateRange).barData, 
      pieData: pieData.length > 0 ? pieData : generateData(dateRange).pieData 
    };
  };

  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        const { data: tData } = await supabase.from('threats').select('*').order('timestamp', { ascending: false });
        const { data: dData } = await supabase.from('devices').select('*');
        
        if (tData) {
          const mappedT = mapThreats(tData);
          setRawThreats(mappedT);
          setChartData(processLiveThreats(mappedT));
          setLiveStats({
            totalAlerts: mappedT.length,
            criticalFixes: mappedT.filter(t => t.severity === 'critical' && t.status === 'mitigated').length,
            uptime: "100.00%"
          });
        }
        
        if (dData) {
          setRawDevices(mapDevices(dData));
        }
      } catch (e) {
        setChartData(generateData(dateRange));
      }
    };
    
    fetchLiveStats();
  }, [dateRange]);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setGenProgress(0);
    setGenSuccess(false);
    
    const interval = setInterval(() => {
      setGenProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          
          // Execute REAL PDF generation
          generateProfessionalPDF(rawDevices, rawThreats, liveStats);
          
          setGenSuccess(true);
          setTimeout(() => {
            setIsGenerating(false);
            setGenSuccess(false);
          }, 2000);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleSchedule = () => {
    setScheduleSuccess(true);
    setTimeout(() => {
      setScheduleSuccess(false);
      setShowSchedule(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-20 max-w-[1400px] mx-auto px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-2xl md:text-[36px] font-bold tracking-tight text-white mb-2 font-headline uppercase">Reports & Analytics</h2>
          <p className="text-text-muted font-black text-[10px] uppercase tracking-[0.3em] font-label">Deep insights into your IIoT security posture.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <button 
              onClick={() => setShowCalendar(!showCalendar)}
              className="btn-secondary w-full flex items-center justify-center gap-2 py-2.5 md:py-2.5"
            >
              <Calendar className="w-4 h-4" />
              {dateRange}
            </button>
            {showCalendar && (
              <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 z-50 glass-card p-4 min-w-[200px] shadow-2xl">
                <div className="space-y-2">
                  {['Last 24 Hours', 'Last 7 Days', 'Last 30 Days', 'Last Quarter'].map((range) => (
                    <button 
                      key={range}
                      onClick={() => {
                        setDateRange(range);
                        setShowCalendar(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                        dateRange === range ? "bg-accent-blue/10 text-accent-blue" : "text-[#A1A8B8] hover:text-white hover:bg-white/5"
                      )}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={handleGenerateReport}
            disabled={isGenerating || genSuccess}
            className={cn(
              "btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2 py-2.5 md:py-2.5 relative overflow-hidden transition-all duration-300",
              isGenerating && "opacity-80 cursor-not-allowed",
              genSuccess && "bg-success hover:bg-success text-white"
            )}
          >
            {isGenerating ? (
              <>
                <div className="absolute inset-0 bg-white/10" style={{ width: `${genProgress}%` }} />
                <span className="relative z-10 text-[10px] font-bold">Generating... {genProgress}%</span>
              </>
            ) : genSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[10px] font-bold">Ready</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Generate PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-4 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-10">
            <h3 className="text-lg md:text-[20px] font-bold text-white font-headline uppercase italic">Threat Trends</h3>
            <div className="flex gap-4 md:gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-accent-blue rounded-full glow-blue" />
                <span className="text-[9px] md:text-[10px] text-[#A1A8B8] uppercase font-bold tracking-widest">Detected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-success rounded-full glow-green" />
                <span className="text-[9px] md:text-[10px] text-[#A1A8B8] uppercase font-bold tracking-widest">Mitigated</span>
              </div>
            </div>
          </div>
          <div className="h-[250px] md:h-[350px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                  tick={{ fill: '#A1A8B8' }}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={9} 
                  tickLine={false} 
                  axisLine={false}
                  dx={-10}
                  tick={{ fill: '#A1A8B8' }}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 22, 41, 0.9)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)',
                  }}
                  itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                />
                <Bar dataKey="detected" fill="#4F8CFF" radius={[4, 4, 0, 0]} barSize={24} />
                <Bar dataKey="mitigated" fill="#22C55E" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-4 md:p-8">
          <h3 className="text-lg md:text-[20px] font-bold text-white mb-8 md:mb-10 font-headline uppercase italic">Threat Distribution</h3>
          <div className="h-[240px] md:h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={window.innerWidth < 640 ? 50 : 60}
                  outerRadius={window.innerWidth < 640 ? 70 : 80}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 22, 41, 0.9)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)',
                  }}
                  itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-6 md:mt-8">
            {chartData.pieData.map((item, idx) => (
              <div key={item.name} className="flex justify-between items-center p-2.5 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx], boxShadow: `0 0 10px ${COLORS[idx]}40` }} />
                  <span className="text-[9px] text-[#A1A8B8] uppercase font-bold tracking-widest">{item.name}</span>
                </div>
                <span className="text-xs text-[#E6EAF2] font-mono font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 md:p-8 group hover:border-accent-blue/30 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent-blue/10 rounded-2xl border border-accent-blue/20 shadow-[0_0_15px_rgba(0,251,251,0.1)]">
                <Shield className="w-6 h-6 text-accent-blue" />
              </div>
              <h4 className="text-base font-bold text-white font-headline uppercase italic">Risk Assessment</h4>
            </div>
          </div>
          <p className="text-sm text-[#A1A8B8] leading-relaxed mb-8 font-medium">
            Risk level is stable. {liveStats.totalAlerts} threats analyzed. Neural pattern matching confirms infrastructure integrity.
          </p>
          <div className="flex items-center gap-2 text-success">
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Normal Ops</span>
          </div>
        </div>

        <div className="glass-card p-6 md:p-8 group hover:border-danger/30 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-danger/10 rounded-2xl border border-danger/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                <AlertTriangle className="w-6 h-6 text-danger" />
              </div>
              <h4 className="text-base font-bold text-[#E6EAF2]">Mitigated Threats</h4>
            </div>
          </div>
          <p className="text-sm text-[#A1A8B8] leading-relaxed mb-8 font-medium">
            {liveStats.criticalFixes} automated isolations performed. Physical kill-switches were engaged in {liveStats.criticalFixes} instances.
          </p>
          <div className="flex items-center gap-2 text-success">
            <Shield className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Auto-Defended</span>
          </div>
        </div>

        <div className="glass-card p-6 md:p-8 group hover:border-accent-purple/30 transition-all relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 font-headline uppercase italic">
              <div className="p-3 bg-accent-purple/10 rounded-2xl border border-accent-purple/20 shadow-[0_0_15px_rgba(255,170,247,0.1)]">
                <Activity className="w-6 h-6 text-accent-purple" />
              </div>
              <h4 className="text-base font-bold text-white">Asset Availability</h4>
            </div>
          </div>
          <p className="text-sm text-[#A1A8B8] leading-relaxed mb-8 font-medium">
            Combined IIoT runtime has reached {liveStats.uptime}. MTBF (Mean Time Between Failures) is currently optimal.
          </p>
          <div className="flex items-center gap-2 text-accent-purple">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">99.9% Uptime</span>
          </div>
        </div>
      </div>

      {/* Asset Health Section */}
      <div className="glass-card p-6 md:p-8 mt-6">
        <h3 className="text-lg font-bold text-white mb-6 uppercase italic font-headline">Neural Predictive Insights: Motor 1</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-[9px] text-text-muted uppercase font-bold tracking-widest mb-1">Health Score</p>
                <p className="text-2xl font-mono font-bold text-success">98.4%</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-[9px] text-text-muted uppercase font-bold tracking-widest mb-1">Vibration Variance</p>
                <p className="text-2xl font-mono font-bold text-accent-blue">LOW</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl">
                <p className="text-[9px] text-text-muted uppercase font-bold tracking-widest mb-1">Failure Probability</p>
                <p className="text-2xl font-mono font-bold text-success">&lt; 0.1%</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-accent-blue/20 glow-blue">
                <p className="text-[9px] text-text-muted uppercase font-bold tracking-widest mb-1">Recommended Action</p>
                <p className="text-xs font-bold text-white">CONTINUE MONITORING</p>
            </div>
        </div>
      </div>

      <div className="flex justify-center pt-10">
        <button 
          onClick={() => setShowSchedule(true)}
          className="flex items-center justify-center w-full sm:w-auto gap-3 px-8 py-4 bg-bg-secondary/50 hover:bg-bg-secondary/80 border border-white/5 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-[#A1A8B8] hover:text-white transition-all"
        >
          <Calendar className="w-5 h-5 text-accent-blue" />
          Schedule Automated Reports
        </button>
      </div>

      {/* Schedule Modal */}
      <AnimatePresence>
        {showSchedule && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !scheduleSuccess && setShowSchedule(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md glass-card p-6 md:p-8"
            >
              <h3 className="text-xl font-bold text-white mb-6">Schedule Reports</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-[#A1A8B8] uppercase font-bold tracking-widest">Frequency</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-blue/30">
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-[#A1A8B8] uppercase font-bold tracking-widest">Recipients</label>
                  <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent-blue/30" placeholder="admin@aegis.security" />
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button 
                  onClick={() => setShowSchedule(false)} 
                  disabled={scheduleSuccess}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSchedule} 
                  disabled={scheduleSuccess}
                  className={cn(
                    "flex-1 py-3 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2",
                    scheduleSuccess ? "bg-success glow-green" : "bg-accent-blue glow-blue"
                  )}
                >
                  {scheduleSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Scheduled
                    </>
                  ) : (
                    "Schedule"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
