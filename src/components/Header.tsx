import React, { useState, useRef, useEffect } from "react";
import { Bell, Search, User, Menu, X, ShieldAlert, Zap, Activity, Cpu, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { devices as mockDevices, threats as mockThreats } from "../mockData";
import { supabase } from "../lib/supabaseClient";
import { mapDevices, mapThreats } from "../lib/supabaseMapper";

interface HeaderProps {
  onLogout: () => void;
  onMenuClick: () => void;
}

const notifications = [
  { id: 1, title: "Critical Threat Detected", description: "DDoS attack simulation detected on Gateway 01.", time: "2m ago", type: "critical", icon: ShieldAlert },
  { id: 2, title: "Device Online", description: "PLC Controller #42 is now connected.", time: "15m ago", type: "info", icon: Activity },
  { id: 3, title: "System Update", description: "New security patches available for deployment.", time: "1h ago", type: "warning", icon: Zap },
];

export default function Header({ onLogout, onMenuClick }: HeaderProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [localNotifications, setLocalNotifications] = useState(notifications);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [liveDevices, setLiveDevices] = useState<any[]>([]);
  const [liveThreats, setLiveThreats] = useState<any[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        const { data: dData } = await supabase.from('devices').select('*');
        const { data: tData } = await supabase.from('threats').select('*');
        if (dData) setLiveDevices(mapDevices(dData));
        if (tData) setLiveThreats(mapThreats(tData));
      } catch (e) {
        console.warn("Header search data fetch failed");
      }
    };
    fetchSearchData();

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    setLocalNotifications([]);
    setTimeout(() => setIsNotificationsOpen(false), 300);
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Dashboard";
    if (path === "/devices") return "Device Management";
    if (path === "/network") return "Network Visualization";
    if (path === "/threats") return "Threat Center";
    if (path === "/simulation") return "Attack Simulation";
    if (path === "/zero-trust") return "Zero Trust";
    if (path === "/reports") return "Reports & Analytics";
    return "Aegis Platform";
  };

  const searchResults = () => {
    if (!searchQuery.trim()) return { devices: [], threats: [] };
    const query = searchQuery.toLowerCase();
    const ds = liveDevices.length > 0 ? liveDevices : mockDevices;
    const ts = liveThreats.length > 0 ? liveThreats : mockThreats;

    return {
      devices: ds.filter(d => d.name.toLowerCase().includes(query) || d.ip.includes(query)).slice(0, 3),
      threats: ts.filter(t => t.name.toLowerCase().includes(query) || t.target?.toLowerCase().includes(query)).slice(0, 3)
    };
  };

  const results = searchResults();
  const hasResults = results.devices.length > 0 || results.threats.length > 0;

  const handleResultClick = (path: string) => {
    navigate(path);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  return (
    <header className="h-[64px] flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 border-b border-white/[0.05]"
      style={{
        background: "linear-gradient(180deg, rgba(14,10,20,0.98) 0%, rgba(14,10,20,0.90) 100%)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.4)",
      }}
    >
      {/* Premium shimmer top border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent-blue/30 to-transparent pointer-events-none" />

      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-text-muted hover:text-text-primary transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-lg md:text-[20px] font-bold text-white truncate font-headline tracking-tight uppercase">{getPageTitle()}</h2>
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md bg-success/10 border border-success/20 font-label">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            <span className="text-[9px] text-success font-black uppercase tracking-widest">Secure Link</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        {/* Desktop Search */}
        <div className="relative group hidden sm:block w-48 md:w-64" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent-blue transition-all duration-300" />
          <input 
            type="text" 
            placeholder="Search devices, threats..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            className="w-full bg-white/5 border border-white/5 rounded-xl py-1.5 pl-10 pr-4 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/30 transition-all duration-300"
          />
          
          <AnimatePresence>
            {isSearchOpen && searchQuery.trim() && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 glass-card overflow-hidden shadow-2xl z-50 border border-white/10"
              >
                {!hasResults ? (
                  <div className="p-4 text-center text-xs text-text-muted">No results found for "{searchQuery}"</div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {results.devices.length > 0 && (
                      <div className="p-2">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2 px-2">Devices</div>
                        {results.devices.map(device => (
                          <button 
                            key={device.id}
                            onClick={() => handleResultClick('/devices')}
                            className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3"
                          >
                            <Cpu className="w-4 h-4 text-accent-blue" />
                            <div>
                              <div className="text-xs font-semibold text-text-primary">{device.name}</div>
                              <div className="text-[10px] text-text-muted">{device.ip}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {results.devices.length > 0 && results.threats.length > 0 && (
                      <div className="h-px bg-white/5 mx-2" />
                    )}

                    {results.threats.length > 0 && (
                      <div className="p-2">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2 px-2">Threats</div>
                        {results.threats.map(threat => (
                          <button 
                            key={threat.id}
                            onClick={() => handleResultClick('/threats')}
                            className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-3"
                          >
                            <ShieldAlert className={cn("w-4 h-4", threat.severity === 'critical' ? 'text-danger' : 'text-warning')} />
                            <div>
                              <div className="text-xs font-semibold text-text-primary">{threat.name}</div>
                              <div className="text-[10px] text-text-muted">Target: {threat.target}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            onClick={() => setIsMobileSearchOpen(true)}
            className="p-2 text-text-muted hover:text-text-primary transition-all duration-300 sm:hidden"
          >
            <Search className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {isMobileSearchOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed inset-0 z-[100] bg-bg-primary/95 backdrop-blur-xl p-4 flex flex-col sm:hidden"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-accent-blue" />
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Search Aegis assets..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-base text-text-primary focus:outline-none focus:border-accent-blue/30"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      setIsMobileSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="p-2 text-text-muted hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {searchQuery.trim() && (
                  <div className="flex-1 overflow-y-auto">
                    {!hasResults ? (
                      <div className="p-4 text-center text-sm text-text-muted italic">Neural link established. No matching signatures.</div>
                    ) : (
                      <div className="space-y-6">
                        {results.devices.length > 0 && (
                          <div className="space-y-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-2">Devices</div>
                            {results.devices.map(device => (
                              <button 
                                key={device.id}
                                onClick={() => {
                                  handleResultClick('/devices');
                                  setIsMobileSearchOpen(false);
                                }}
                                className="w-full text-left p-4 bg-white/5 rounded-2xl flex items-center gap-4 active:bg-white/10"
                              >
                                <Cpu className="w-5 h-5 text-accent-blue" />
                                <div>
                                  <div className="text-sm font-bold text-text-primary">{device.name}</div>
                                  <div className="text-[10px] text-text-muted font-mono">{device.ip}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        {results.threats.length > 0 && (
                          <div className="space-y-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-2">Threats</div>
                            {results.threats.map(threat => (
                              <button 
                                key={threat.id}
                                onClick={() => {
                                  handleResultClick('/threats');
                                  setIsMobileSearchOpen(false);
                                }}
                                className="w-full text-left p-4 bg-white/5 rounded-2xl flex items-center gap-4 active:bg-white/10"
                              >
                                <ShieldAlert className={cn("w-5 h-5", threat.severity === 'critical' ? 'text-danger' : 'text-warning')} />
                                <div>
                                  <div className="text-sm font-bold text-text-primary">{threat.name}</div>
                                  <div className="text-[10px] text-text-muted">Target: {threat.target}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={cn(
                "relative p-2 text-text-muted hover:text-text-primary transition-all duration-300 group rounded-xl",
                isNotificationsOpen && "bg-white/10 text-text-primary"
              )}
            >
              <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {localNotifications.length > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border-2 border-bg-primary shadow-[0_0_10px_#ef4444]" />
              )}
            </button>

            <AnimatePresence>
              {isNotificationsOpen && (
                <>
                  {/* Backdrop for mobile */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsNotificationsOpen(false)}
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                  />
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="fixed lg:absolute top-[70px] lg:top-full right-4 lg:right-0 w-[calc(100vw-32px)] sm:w-80 lg:mt-2 glass-card p-4 z-50 overflow-hidden shadow-2xl"
                  >
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
                      <h3 className="text-xs font-bold text-text-primary uppercase tracking-widest">Notifications</h3>
                      <button 
                        onClick={() => setIsNotificationsOpen(false)}
                        className="p-1 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
                      >
                        <X className="w-4 h-4 text-text-muted" />
                      </button>
                    </div>
                    
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
                      {localNotifications.length > 0 ? (
                        localNotifications.map((notif) => (
                          <div key={notif.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all cursor-pointer group">
                            <div className="flex gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                                notif.type === "critical" ? "bg-danger/10 text-danger" : 
                                notif.type === "warning" ? "bg-warning/10 text-warning" : "bg-accent-blue/10 text-accent-blue"
                              )}>
                                <notif.icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-text-primary mb-0.5 truncate">{notif.title}</p>
                                <p className="text-[10px] text-text-secondary leading-tight line-clamp-2 mb-1">{notif.description}</p>
                                <span className="text-[9px] text-text-muted font-medium">{notif.time}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center">
                          <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">No new notifications</p>
                        </div>
                      )}
                    </div>
                    
                    {localNotifications.length > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="w-full mt-4 py-2 text-[10px] font-bold text-accent-blue hover:text-blue-400 uppercase tracking-widest transition-all border-t border-white/5 pt-4"
                      >
                        Mark all as read
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 pl-2 group cursor-pointer"
            >
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center border border-white/20 shadow-xl transition-all duration-300 group-hover:scale-110 glow-blue">
                <User className="text-white w-4 h-4 md:w-5 md:h-5" />
              </div>
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsProfileOpen(false)}
                    className="fixed inset-0 z-40"
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full right-0 mt-2 w-48 glass-card p-2 z-50 shadow-2xl border border-white/10"
                  >
                    <div className="px-3 py-2 mb-2 border-b border-white/5">
                      <p className="text-[11px] font-bold text-text-primary truncate">Admin User</p>
                      <p className="text-[9px] text-text-muted truncate">admin@aegis.security</p>
                    </div>
                    <button 
                      onClick={onLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-danger hover:bg-danger/10 rounded-lg transition-all uppercase tracking-widest"
                    >
                      Logout
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
