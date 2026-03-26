import React from "react";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Database, 
  Lock, 
  Cpu,
  Save,
  ChevronRight,
  Network,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Share2,
  Trash2,
  Terminal
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { siemLogger } from "../lib/siemLogger";

const SettingItem = ({ icon: Icon, title, description, active, onClick, className }: any) => (
  <div 
    onClick={onClick}
    className={cn(
      "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group",
      active ? "bg-accent-blue/10 border-accent-blue/30 shadow-[0_0_20px_rgba(79,140,255,0.1)]" : "bg-bg-secondary/30 border-white/[0.06] hover:bg-bg-secondary/50 hover:border-white/10",
      className
    )}
  >
    <div className="flex items-center gap-4">
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center border",
        active ? "bg-accent-blue/20 border-accent-blue/20 text-accent-blue" : "bg-bg-secondary/50 border-white/[0.06] text-text-muted"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-text-primary group-hover:text-accent-blue transition-colors">{title}</h4>
        <p className="text-[9px] text-text-muted uppercase tracking-widest font-bold">{description}</p>
      </div>
    </div>
    <ChevronRight className={cn("w-4 h-4 transition-transform", active ? "text-accent-blue translate-x-1" : "text-text-muted/40")} />
  </div>
);

export default function Settings() {
  const [activeTab, setActiveTab] = React.useState("profile");
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (window.innerWidth < 1024 && contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  // States for interactivity
  const [accessLevel, setAccessLevel] = React.useState("Level 4");
  const [twoFactorEnabled, setTwoFactorEnabled] = React.useState(true);
  
  const [notifications, setNotifications] = React.useState([
    { label: "Email Notifications", enabled: true },
    { label: "SMS Alerts", enabled: false },
    { label: "Push Notifications", enabled: true },
    { label: "Slack Integration", enabled: true },
  ]);

  const [securityPolicies, setSecurityPolicies] = React.useState([
    { title: "Strict Device Onboarding", desc: "Require manual approval for all new IIoT nodes.", enabled: true },
    { title: "Automatic Threat Isolation", desc: "Instantly isolate devices with risk scores > 80.", enabled: true },
    { title: "Encrypted Communication", desc: "Enforce TLS 1.3 for all inter-node traffic.", enabled: true },
    { title: "Periodic Compliance Scanning", desc: "Run full network audits every 24 hours.", enabled: false },
  ]);

  const [discoveryEnabled, setDiscoveryEnabled] = React.useState(true);
  const [discoveryInterval, setDiscoveryInterval] = React.useState("Every 15 Minutes");

  const [apiIntegrations, setApiIntegrations] = React.useState([
    { name: "Azure Sentinel", status: "Connected", icon: "☁️" },
    { name: "Splunk SIEM", status: "Disconnected", icon: "📊" },
    { name: "ServiceNow", status: "Connected", icon: "🛠️" },
  ]);

  const [complianceStatus, setComplianceStatus] = React.useState([
    { name: "SOC2 Type II", progress: 85, status: "In Progress" },
    { name: "ISO 27001", progress: 60, status: "Audit Pending" },
    { name: "NIST Cybersecurity Framework", progress: 45, status: "Implementation" },
  ]);

  const [rbacUsers, setRbacUsers] = React.useState([
    { name: "Security Admin", role: "Superuser", lastActive: "Active Now" },
    { name: "DevOps Engineer", role: "Operator", lastActive: "2h ago" },
    { name: "Audit Controller", role: "Read-Only", lastActive: "1d ago" },
  ]);

  const [dataRetention, setDataRetention] = React.useState({
    logStorage: "90 Days",
    autoArchive: true,
    complianceMode: false
  });

  const [networkConfig, setNetworkConfig] = React.useState({
    proxyEnabled: false,
    proxyAddress: "10.0.0.5:8080",
    gatewayMode: "Strict",
    vpnConnected: true
  });

  const [alertThresholds, setAlertThresholds] = React.useState({
    temperature: 85,
    vibration: 0.8,
    current: 15
  });

  const [dataResidency, setDataResidency] = React.useState("US-East-1 (Primary)");

  const [apiTokens, setApiTokens] = React.useState([
    { id: "tk_4921", name: "Grafana Reader", expiration: "Never", lastUsed: "4m ago" },
    { id: "tk_8820", name: "SIEM Integrator", expiration: "2024-12-01", lastUsed: "12h ago" },
  ]);

  const [activeNodes, setActiveNodes] = React.useState([
    { id: "ESP32-NODE-01", ip: "192.168.1.45", status: "Authorized" },
    { id: "ESP32-NODE-02", ip: "192.168.1.46", status: "Pending Approval" },
  ]);

  const [auditLog, setAuditLog] = React.useState<string[]>([]);
  
  React.useEffect(() => {
    const events = [
      "Node-01 Integrity: 100%",
      "Firewall Hash Verified",
      "Encrypted Tunnel: STABLE",
      "Firmware Signature: VALID",
      "Network Latency: 12ms",
      "Zero-Trust Policy: ENFORCED"
    ];
    
    const interval = setInterval(() => {
      const event = events[Math.floor(Math.random() * events.length)];
      setAuditLog(prev => [event, ...prev].slice(0, 5));
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const [isSaving, setIsSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [showClearDataModal, setShowClearDataModal] = React.useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1500);
  };

  const handleClearDataConfirm = () => {
    setShowClearDataModal(false);
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1500);
  };

  const toggleNotification = (index: number) => {
    const newNotifs = [...notifications];
    newNotifs[index].enabled = !newNotifs[index].enabled;
    setNotifications(newNotifs);
  };

  const provisionUser = () => {
    const names = ["Cloud Architect", "SOC Analyst", "Compliance Officer"];
    const roles = ["Operator", "Security Admin", "Read-Only"];
    const newName = names[Math.floor(Math.random() * names.length)];
    const newRole = roles[Math.floor(Math.random() * roles.length)];
    setRbacUsers([...rbacUsers, { name: newName, role: newRole, lastActive: "Just now" }]);
  };

  const removeUser = (index: number) => {
    if (rbacUsers.length > 1) {
      setRbacUsers(rbacUsers.filter((_, i) => i !== index));
    }
  };

  const generateToken = () => {
    const id = `tk_${Math.floor(Math.random() * 9000) + 1000}`;
    setApiTokens([...apiTokens, { id, name: "New Integration", expiration: "30 Days", lastUsed: "Never" }]);
  };

  const revokeToken = (id: string) => {
    setApiTokens(apiTokens.filter(t => t.id !== id));
  };

  const [activeProtocol, setActiveProtocol] = React.useState("TLS");

  const togglePolicy = (index: number) => {
    const newPolicies = [...securityPolicies];
    newPolicies[index].enabled = !newPolicies[index].enabled;
    setSecurityPolicies(newPolicies);
  };

  const toggleApi = (index: number) => {
    const newApis = [...apiIntegrations];
    newApis[index].status = newApis[index].status === "Connected" ? "Disconnected" : "Connected";
    setApiIntegrations(newApis);
    
    // Update logger enabled state if Splunk is toggled
    if (newApis[index].name === "Splunk SIEM") {
      siemLogger.updateConfig({ enabled: newApis[index].status === "Connected" });
    }
  };

  const [siemSettings, setSiemSettings] = React.useState(siemLogger.getConfig());

  const handleSiemChange = (field: string, value: any) => {
    const updated = { ...siemSettings, [field]: value };
    setSiemSettings(updated);
    siemLogger.updateConfig(updated);
  };

  const [dispatchHistory, setDispatchHistory] = React.useState<any[]>([]);

  React.useEffect(() => {
    siemLogger.setOnDispatchUpdate((history) => {
      setDispatchHistory([...history]);
    });
  }, []);

  const setPreset = (type: 'discord' | 'slack') => {
    if (type === 'discord') {
      handleSiemChange('webhookUrl', 'https://discord.com/api/webhooks/...');
    } else {
      handleSiemChange('webhookUrl', 'https://hooks.slack.com/services/...');
    }
  };

  const testSiemConnection = async () => {
    setIsSaving(true);
    const results = await siemLogger.testConnection();
    
    setTimeout(() => {
      setIsSaving(false);
      const wasSuccess = results.some(r => r.success);
      if (wasSuccess) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert("🛡️ Aegis Security Alert: SIEM Connection Failed. Verify endpoints and tokens.");
      }
    }, 1000);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold ml-1">Enterprise Identity</label>
                <div className="flex items-center gap-4 p-4 bg-bg-secondary/30 border border-white/5 rounded-2xl">
                   <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple flex items-center justify-center text-2xl border border-white/10 shadow-xl">
                     <User className="text-white w-8 h-8" />
                   </div>
                   <div>
                     <h4 className="text-lg font-bold text-text-primary">Admin_Node_01</h4>
                     <p className="text-xs text-text-muted">Registered: March 2024</p>
                   </div>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-3">
                 <button className="btn-secondary w-full text-[10px] uppercase font-bold tracking-widest py-3">Update Biometric Auth</button>
                 <button className="btn-secondary w-full text-[10px] uppercase font-bold tracking-widest py-3">Revoke All Sessions</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/[0.06]">
              <div className="space-y-3">
                <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold ml-1">Full Name</label>
                <input 
                  type="text" 
                  defaultValue="Security Admin"
                  className="w-full bg-bg-secondary/50 border border-white/[0.06] rounded-xl py-4 px-5 text-sm text-text-primary focus:outline-none focus:border-accent-blue/50 transition-all font-medium"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] text-text-muted uppercase tracking-widest font-bold ml-1">Corporate Email</label>
                <input 
                  type="email" 
                  defaultValue="admin@aegis-enterprise.io"
                  className="w-full bg-bg-secondary/50 border border-white/[0.06] rounded-xl py-4 px-5 text-sm text-text-primary focus:outline-none focus:border-accent-blue/50 transition-all font-medium"
                />
              </div>
            </div>

            <div className="pt-8 border-t border-white/[0.06]">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
                <Lock className="w-4 h-4 text-accent-blue" />
                Access Management (IAM)
              </h4>
              <div className="space-y-4">
                 {rbacUsers.map((user, i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.04] transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center text-xs font-bold text-text-muted">{user.name[0]}</div>
                        <div>
                          <p className="text-xs font-bold text-text-primary">{user.name}</p>
                          <p className="text-[9px] text-text-muted uppercase tracking-widest font-bold">{user.lastActive}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="px-3 py-1 bg-accent-blue/10 border border-accent-blue/20 rounded-md text-[9px] text-accent-blue font-bold uppercase tracking-widest">
                          {user.role}
                        </div>
                        {i > 0 && (
                          <button 
                            onClick={() => removeUser(i)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-danger hover:bg-danger/10 rounded-lg transition-all"
                          >
                            ×
                          </button>
                        )}
                      </div>
                   </div>
                 ))}
                 <button 
                   onClick={provisionUser}
                   className="w-full py-3 border border-dashed border-white/10 rounded-xl text-[9px] text-text-muted hover:text-text-primary hover:border-white/20 transition-all font-bold uppercase tracking-widest mt-2 active:scale-[0.98]"
                 >
                   + Provision New Team Member
                 </button>
              </div>
            </div>
          </div>
        );
      case "notifications":
        return (
          <div className="space-y-8">
            <div className="space-y-6">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest">Alert Channels</h4>
              <div className="space-y-4">
                {notifications.map((channel, idx) => (
                  <div key={channel.label} className="flex items-center justify-between p-4 bg-bg-secondary/30 border border-white/[0.06] rounded-xl">
                    <span className="text-sm font-medium text-text-primary">{channel.label}</span>
                    <div 
                      onClick={() => toggleNotification(idx)}
                      className={cn(
                        "w-10 h-5 rounded-full relative cursor-pointer transition-all",
                        channel.enabled ? "bg-accent-blue" : "bg-white/10"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                        channel.enabled ? "right-1" : "left-1"
                      )} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case "api":
        return (
          <div className="space-y-8">
            <div className="space-y-6">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                <Lock className="w-4 h-4 text-accent-blue" />
                Auth Token Management
              </h4>
              <div className="space-y-4">
                {apiTokens.map((token) => (
                  <div key={token.id} className="p-5 bg-bg-secondary/30 border border-white/[0.06] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-accent-blue/10 flex items-center justify-center text-accent-blue">
                          <Database className="w-5 h-5" />
                       </div>
                       <div>
                          <h5 className="text-sm font-bold text-text-primary">{token.name}</h5>
                          <p className="text-[10px] text-text-muted font-mono">{token.id} • Last used {token.lastUsed}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Exp: {token.expiration}</span>
                       <button 
                        onClick={() => revokeToken(token.id)}
                        className="text-[10px] font-bold text-danger uppercase hover:underline active:scale-95"
                       >
                         Revoke
                       </button>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={generateToken}
                  className="w-full py-4 border border-dashed border-accent-blue/20 rounded-2xl text-[10px] font-bold text-accent-blue uppercase tracking-widest hover:bg-accent-blue/5 transition-all active:scale-[0.99]"
                >
                  + Generate New Infrastructure Token
                </button>
              </div>
            </div>

             <div className="pt-8 border-t border-white/[0.06] space-y-8">
               <div className="flex items-center justify-between">
                 <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest">Third-Party Sink Nodes</h4>
                 <div className="flex items-center gap-2">
                   <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">External SIEM Status:</span>
                   <div className={cn("w-2 h-2 rounded-full", siemSettings.enabled ? "bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-white/10")} />
                 </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {apiIntegrations.map((api, idx) => (
                    <div 
                      key={api.name} 
                      onClick={() => toggleApi(idx)}
                      className={cn(
                        "p-4 bg-white/[0.02] border border-white/5 rounded-xl text-center cursor-pointer transition-all hover:bg-white/[0.06]",
                        api.status === "Connected" ? "border-success/30 shadow-[0_0_15px_rgba(34,197,94,0.05)]" : "opacity-60"
                      )}
                    >
                       <div className="text-2xl mb-2">{api.icon}</div>
                       <p className="text-xs font-bold text-text-primary">{api.name}</p>
                       <p className={cn("text-[9px] font-bold uppercase mt-1", api.status === "Connected" ? "text-success" : "text-text-muted")}>{api.status}</p>
                    </div>
                  ))}
               </div>

               {/* Advanced SIEM Configuration */}
               <div className="p-6 bg-accent-blue/5 border border-accent-blue/10 rounded-2xl space-y-6">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <Terminal className="w-4 h-4 text-accent-blue" />
                     <h5 className="text-sm font-bold text-text-primary">Splunk HEC & Webhook Advanced Config</h5>
                   </div>
                   <button 
                     onClick={testSiemConnection}
                     className="text-[10px] bg-accent-blue/10 hover:bg-accent-blue/20 text-accent-blue font-bold py-1.5 px-3 rounded-lg border border-accent-blue/20 transition-all uppercase tracking-widest"
                   >
                     Test Connection
                   </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-3">
                     <label className="text-[9px] text-text-muted uppercase font-bold tracking-widest ml-1">Splunk HEC Endpoint</label>
                     <input 
                       type="text" 
                       placeholder="https://splunk:8088/services/collector"
                       value={siemSettings.splunkUrl}
                       onChange={(e) => handleSiemChange('splunkUrl', e.target.value)}
                       className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs text-text-primary focus:border-accent-blue/50 outline-none transition-all font-mono"
                     />
                   </div>
                   <div className="space-y-3">
                     <label className="text-[9px] text-text-muted uppercase font-bold tracking-widest ml-1">Splunk Auth Token</label>
                     <input 
                       type="password" 
                       placeholder="00000000-0000-0000-0000-000000000000"
                       value={siemSettings.splunkToken}
                       onChange={(e) => handleSiemChange('splunkToken', e.target.value)}
                       className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs text-text-primary focus:border-accent-blue/50 outline-none transition-all font-mono"
                     />
                   </div>
                   <div className="space-y-3 md:col-span-2">
                     <label className="text-[9px] text-text-muted uppercase font-bold tracking-widest ml-1">Generic Webhook Destination (SIEM Sinks)</label>
                     <input 
                       type="text" 
                       placeholder="https://hooks.example.com/security/aegis"
                       value={siemSettings.webhookUrl}
                       onChange={(e) => handleSiemChange('webhookUrl', e.target.value)}
                       className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs text-text-primary focus:border-accent-blue/50 outline-none transition-all font-mono"
                     />
                   </div>
                 </div>
                 
                 <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                   <p className="text-[10px] text-text-secondary leading-relaxed flex gap-2">
                     <span className="text-accent-blue font-bold">PRO TIP:</span> 
                     Logs are dispatched in real-time as JSON events. Ensure your Splunk HEC index is configured for 'dashboards' to enable pre-built Aegis visualizations.
                   </p>
                 </div>
               </div>
            </div>
          </div>
        );
      case "logs":
        return (
          <div className="space-y-8">
            <div className="space-y-6">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest">System Audit Logs</h4>
              <div className="bg-bg-secondary/30 border border-white/[0.06] rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                      <th className="px-4 py-3 font-bold text-text-muted uppercase tracking-widest">Timestamp</th>
                      <th className="px-4 py-3 font-bold text-text-muted uppercase tracking-widest">Event</th>
                      <th className="px-4 py-3 font-bold text-text-muted uppercase tracking-widest">User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {[
                      { time: "2024-03-24 10:45:12", event: "Policy Update: Strict Onboarding", user: "Admin" },
                      { time: "2024-03-24 09:30:05", event: "New Device Authorized: Sensor_A9", user: "System" },
                      { time: "2024-03-24 08:15:44", event: "Login Success", user: "bragadeeshwaranp1@gmail.com" },
                      { time: "2024-03-23 22:10:19", event: "Threat Isolated: Node_77", user: "AI Copilot" },
                    ].map((log, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-text-muted font-mono">{log.time}</td>
                        <td className="px-4 py-3 text-text-primary font-medium">{log.event}</td>
                        <td className="px-4 py-3 text-text-muted">{log.user}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case "discovery":
        return (
          <div className="space-y-8">
            <div className="space-y-6">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                <Cpu className="w-4 h-4 text-accent-purple" />
                Network Node Onboarding
              </h4>
              <div className="p-6 bg-bg-secondary/30 border border-white/[0.06] rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-6">
                <div>
                  <h5 className="text-sm font-bold text-text-primary mb-1">Continuous Asset Discovery</h5>
                  <p className="text-[11px] text-text-muted">Automatically scan subnets for new IIOT sensors.</p>
                </div>
                <div 
                  onClick={() => setDiscoveryEnabled(!discoveryEnabled)}
                  className={cn(
                    "w-12 h-6 rounded-full relative cursor-pointer transition-all",
                    discoveryEnabled ? "bg-accent-purple shadow-[0_0_15px_rgba(155,107,255,0.4)]" : "bg-white/10"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    discoveryEnabled ? "right-1" : "left-1"
                  )} />
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-[10px] text-text-muted uppercase font-bold tracking-widest ml-1">Discovered Assets</h5>
                <div className="grid gap-3">
                  {activeNodes.map((node) => (
                    <div key={node.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between">
                       <div className="flex items-center gap-4">
                         <div className="w-2 h-2 rounded-full bg-accent-purple animate-pulse" />
                         <div>
                            <p className="text-xs font-bold text-text-primary">{node.id}</p>
                            <p className="text-[10px] font-mono text-text-muted">{node.ip}</p>
                         </div>
                       </div>
                       <div className={cn("px-2 py-1 rounded text-[9px] font-bold uppercase", node.status === "Authorized" ? "bg-success/10 text-success" : "bg-warning/10 text-warning")}>
                         {node.status}
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case "security":
        return (
          <div className="space-y-8">
            <div className="space-y-6">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-4 h-4 text-danger" />
                Advanced Threat Defense
              </h4>
              <div className="space-y-4">
                {securityPolicies.map((policy, idx) => (
                  <div key={policy.title} className="p-5 bg-bg-secondary/30 border border-white/[0.06] rounded-2xl flex items-start justify-between gap-4 group hover:border-white/10 transition-all">
                    <div>
                      <h5 className="text-sm font-bold text-text-primary mb-1 group-hover:text-accent-blue transition-colors">{policy.title}</h5>
                      <p className="text-[11px] text-text-muted leading-relaxed">{policy.desc}</p>
                    </div>
                    <div 
                      onClick={() => togglePolicy(idx)}
                      className={cn(
                        "w-10 h-5 rounded-full relative cursor-pointer transition-all shrink-0 mt-1",
                        policy.enabled ? "bg-accent-blue shadow-[0_0_10px_rgba(79,140,255,0.4)]" : "bg-white/10"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                        policy.enabled ? "right-1" : "left-1"
                      )} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-white/[0.06]">
               <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-6">Automated IR (Incident Response)</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                     <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">Max Risk Threshold</p>
                     <p className="text-lg font-mono font-bold text-text-primary">85%</p>
                  </div>
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                     <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">Response Action</p>
                     <p className="text-sm font-bold text-danger">ISOLATE NODE</p>
                  </div>
               </div>
            </div>
          </div>
        );
      case "compliance":
        return (
          <div className="space-y-8">
            <div className="space-y-6">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-4 h-4 text-success" />
                Security Framework Compliance
              </h4>
              <div className="space-y-6">
                {complianceStatus.map((c, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex justify-between items-end">
                      <div>
                        <h5 className="text-sm font-bold text-text-primary">{c.name}</h5>
                        <p className="text-[9px] text-text-muted uppercase font-bold tracking-widest">{c.status}</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-accent-blue">{c.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${c.progress}%` }}
                        className="h-full bg-gradient-to-r from-accent-blue to-accent-purple"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-white/[0.06] p-6 bg-accent-blue/5 rounded-2xl border border-accent-blue/10">
               <div className="flex gap-4">
                 <div className="w-12 h-12 rounded-xl bg-accent-blue/20 flex items-center justify-center shrink-0">
                    <Shield className="text-accent-blue w-6 h-6" />
                 </div>
                 <div>
                    <h5 className="text-sm font-bold text-text-primary mb-1">Compliance Shield Active</h5>
                    <p className="text-[11px] text-text-secondary leading-relaxed">Your data residency and transit policies currently meet 82% of Global IIoT Security Standards. Download the full readiness report for detailed gaps.</p>
                    <button className="mt-4 text-[10px] font-bold text-accent-blue uppercase tracking-widest hover:underline">Download Readiness PDF</button>
                 </div>
               </div>
            </div>
          </div>
        );
      case "data":
        return (
          <div className="space-y-8">
            <div className="space-y-6">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                <Database className="w-4 h-4 text-accent-blue" />
                Data Residency & Retention
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="p-6 bg-bg-secondary/30 border border-white/[0.06] rounded-2xl space-y-4">
                    <label className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Log Storage (Audit Vault)</label>
                    <div className="flex items-center justify-between">
                       <span className="text-sm font-bold text-text-primary">{dataRetention.logStorage}</span>
                       <button className="text-[10px] text-accent-blue font-bold uppercase tracking-widest">Change</button>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full">
                       <div className="h-full w-[45%] bg-accent-blue rounded-full glow-blue" />
                    </div>
                    <p className="text-[9px] text-text-muted">Currently using 1.2GB of 10GB allocated storage.</p>
                 </div>
                 <div className="p-6 bg-bg-secondary/30 border border-white/[0.06] rounded-2xl space-y-4">
                    <label className="text-[10px] text-text-muted uppercase font-bold tracking-widest">Primary Geolocation</label>
                    <div className="flex items-center justify-between">
                       <span className="text-sm font-bold text-text-primary">{dataResidency}</span>
                       <Globe className="w-4 h-4 text-text-muted" />
                    </div>
                    <div className="flex gap-1 py-1">
                       {[1,1,1,1,0.5,0.2,0.1].map((o, i) => (
                         <div key={i} className="h-4 flex-1 bg-accent-blue rounded" style={{opacity: o}} />
                       ))}
                    </div>
                    <p className="text-[9px] text-text-muted">Edge nodes syncing with 99.99% consistency.</p>
                 </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/[0.06] space-y-4">
               <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <div>
                    <h5 className="text-xs font-bold text-text-primary">Immutable Audit Trail</h5>
                    <p className="text-[10px] text-text-muted">Compliance mode prevents any log modification.</p>
                  </div>
                  <div 
                      onClick={() => setDataRetention({...dataRetention, complianceMode: !dataRetention.complianceMode})}
                      className={cn(
                        "w-10 h-5 rounded-full relative cursor-pointer transition-all",
                        dataRetention.complianceMode ? "bg-success shadow-[0_0_10px_rgba(34,197,94,0.3)]" : "bg-white/10"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                        dataRetention.complianceMode ? "right-1" : "left-1"
                      )} />
                    </div>
               </div>
            </div>
          </div>
        );
      case "network":
        return (
          <div className="space-y-10">
            <div className="space-y-6">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest flex items-center gap-2">
                <Network className="w-4 h-4 text-accent-blue" />
                Infrastructure Gateway
              </h4>
              <div className="p-6 bg-bg-secondary/30 border border-white/[0.06] rounded-2xl">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                       <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border", networkConfig.vpnConnected ? "bg-success/20 border-success/30 text-success glow-green" : "bg-danger/20 border-danger/30 text-danger")}>
                          <Shield className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-text-primary">Corporate VPN Tunnel</p>
                          <p className={cn("text-[10px] uppercase font-bold tracking-widest", networkConfig.vpnConnected ? "text-success" : "text-danger")}>
                            {networkConfig.vpnConnected ? "SECURE CONNECTION ACTIVE" : "CONNECTION LOST"}
                          </p>
                       </div>
                    </div>
                    <button 
                      onClick={() => setNetworkConfig({...networkConfig, vpnConnected: !networkConfig.vpnConnected})}
                      className={cn(
                        "px-6 py-2 text-[10px] uppercase font-bold tracking-widest rounded-xl transition-all active:scale-95 border",
                        networkConfig.vpnConnected ? "bg-bg-secondary border-white/10 text-text-muted hover:bg-bg-tertiary" : "bg-accent-blue border-accent-blue/30 text-white shadow-[0_0_15px_rgba(79,140,255,0.3)] hover:shadow-[0_0_20px_rgba(79,140,255,0.5)]"
                      )}
                    >
                      {networkConfig.vpnConnected ? "Disconnect" : "Reconnect"}
                    </button>
                 </div>
              </div>
            </div>

            <div className="pt-8 border-t border-white/[0.06] grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-3">
                  <label className="text-[10px] text-text-muted uppercase font-bold tracking-widest ml-1">Proxy Server</label>
                  <input 
                    type="text" 
                    value={networkConfig.proxyAddress}
                    onChange={(e) => setNetworkConfig({...networkConfig, proxyAddress: e.target.value})}
                    className="w-full bg-bg-secondary/50 border border-white/[0.06] rounded-xl py-4 px-5 text-sm text-text-primary focus:outline-none focus:border-accent-blue/50"
                  />
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] text-text-muted uppercase font-bold tracking-widest ml-1">Traffic Protocol</label>
                  <div className="flex gap-2">
                     {["TCP", "UDP", "TLS"].map(p => (
                       <button 
                        key={p} 
                        onClick={() => setActiveProtocol(p)}
                        className={cn("flex-1 py-4 border rounded-xl text-[10px] font-bold uppercase transition-all active:scale-95", activeProtocol === p ? "border-accent-blue text-accent-blue bg-accent-blue/5" : "border-white/5 text-text-muted hover:border-white/10")}
                       >
                         {p}
                       </button>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
              <SettingsIcon className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Section Under Development</h3>
            <p className="text-sm text-text-muted max-w-xs">This settings module is currently being optimized for the Aegis platform.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-10 pb-20 max-w-[1400px] mx-auto px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-2xl md:text-[32px] font-bold tracking-tight text-white mb-1 font-headline uppercase">System Settings</h2>
          <p className="text-text-muted font-black text-[10px] uppercase tracking-[0.3em] font-label">Configure your Aegis security platform preferences.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "btn-primary flex items-center gap-2 w-full md:w-auto justify-center transition-all",
            isSaving && "opacity-80 cursor-not-allowed",
            saveSuccess && "bg-success border-success text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]"
          )}
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : saveSuccess ? (
            <div className="w-4 h-4 flex items-center justify-center">✓</div>
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? "Saving..." : saveSuccess ? "Saved Successfully" : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 flex lg:flex-col gap-3 md:gap-4 overflow-x-auto pb-2 lg:pb-0 no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
          <SettingItem icon={User} title="Access & Identity" description="IAM and user role management" active={activeTab === "profile"} onClick={() => handleTabChange("profile")} className="shrink-0 w-[240px] lg:w-full" />
          <SettingItem icon={Shield} title="Threat Defense" description="Global security and IR policies" active={activeTab === "security"} onClick={() => handleTabChange("security")} className="shrink-0 w-[240px] lg:w-full" />
          <SettingItem icon={Globe} title="Compliance" description="SOC2, ISO and NIST tracking" active={activeTab === "compliance"} onClick={() => handleTabChange("compliance")} className="shrink-0 w-[240px] lg:w-full" />
          <SettingItem icon={Bell} title="System Alerts" description="Notification and delivery rules" active={activeTab === "notifications"} onClick={() => handleTabChange("notifications")} className="shrink-0 w-[240px] lg:w-full" />
          <SettingItem icon={Database} title="Audit & Records" description="Log auditing and data retention" active={activeTab === "data"} onClick={() => handleTabChange("data")} className="shrink-0 w-[240px] lg:w-full" />
          <SettingItem icon={Cpu} title="Node Discovery" description="Network scanning and onboarding" active={activeTab === "discovery"} onClick={() => handleTabChange("discovery")} className="shrink-0 w-[240px] lg:w-full" />
          <SettingItem icon={Network} title="Infrastructure" description="Proxy and network gateway" active={activeTab === "network"} onClick={() => handleTabChange("network")} className="shrink-0 w-[240px] lg:w-full" />
          <SettingItem icon={Lock} title="API Connectors" description="External SIEM and cloud tokens" active={activeTab === "api"} onClick={() => handleTabChange("api")} className="shrink-0 w-[240px] lg:w-full" />
        </div>

        <div ref={contentRef} className="lg:col-span-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-bg-secondary/40 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 md:p-10 frost-border relative overflow-hidden min-h-[600px]"
            >
              {/* Auditor Ticker */}
              <div className="absolute top-0 right-6 md:right-10 flex items-center gap-3 py-1.5 px-4 bg-accent-blue/5 rounded-b-xl border-x border-b border-white/5 z-20">
                <Activity className="w-3 h-3 text-accent-blue animate-pulse" />
                <span className="text-[9px] text-accent-blue font-mono uppercase tracking-[0.1em] whitespace-nowrap">
                  {auditLog[0] || "SEC_AUDITOR: ACTIVE"}
                </span>
              </div>

              <div className="relative z-10">
                <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-8 md:mb-10 capitalize">{activeTab.replace("-", " ")} Settings</h3>
                {renderContent()}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {showClearDataModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0A0A0A] border border-white/[0.06] p-6 md:p-8 rounded-2xl max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-danger to-warning" />
            <h3 className="text-xl font-bold text-text-primary mb-2">Clear All Data?</h3>
            <p className="text-sm text-text-secondary mb-6">
              This action will permanently delete all historical data, audit logs, and archived records. This action cannot be undone. Are you absolutely sure?
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowClearDataModal(false)}
                className="px-4 py-2 bg-bg-secondary/50 hover:bg-bg-secondary/70 text-text-primary rounded-xl border border-white/[0.06] transition-all text-sm font-bold"
              >
                Cancel
              </button>
              <button 
                onClick={handleClearDataConfirm}
                className="px-4 py-2 bg-danger/10 hover:bg-danger/20 text-danger rounded-xl border border-danger/20 transition-all text-sm font-bold"
              >
                Yes, Clear Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
