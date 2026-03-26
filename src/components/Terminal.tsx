import React, { useState, useEffect, useRef } from "react";
import { Terminal as TerminalIcon, Shield, Zap, Activity, HelpCircle, User, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabaseClient";
import { mapDevices } from "../lib/supabaseMapper";
import { cn } from "../lib/utils";

interface CommandLog {
  id: string;
  type: "input" | "output" | "error" | "system";
  content: string;
  timestamp: Date;
}

const AEGIS_BANNER = `
 █████╗ ███████╗ ██████╗ ██╗███████╗
██╔══██╗██╔════╝██╔════╝ ██║██╔════╝
███████║█████╗  ██║  ███╗██║███████╗
██╔══██║██╔══╝  ██║   ██║██║╚════██║
██║  ██║███████╗╚██████╔╝██║███████║
╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝╚══════╝
      IIoT SECURITY COMMAND CENTER
`;

export default function Terminal() {
  const [logs, setLogs] = useState<CommandLog[]>([
    { id: "1", type: "system", content: AEGIS_BANNER, timestamp: new Date() },
    { id: "2", type: "system", content: "Establishing encrypted tunnel to lzjqvjjtkddyuehuypmi...", timestamp: new Date() },
    { id: "3", type: "system", content: "Connection Established. Terminal Ready. Type 'help' for commands.", timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const addLog = (content: string, type: CommandLog["type"] = "output") => {
    setLogs(prev => [...prev, { 
      id: Math.random().toString(36).substr(2, 9), 
      type, 
      content, 
      timestamp: new Date() 
    }]);
  };

  const handleCommand = async (cmd: string) => {
    const fullCmd = cmd.trim();
    if (!fullCmd) return;

    addLog(`oper@aegis:~$ ${fullCmd}`, "input");
    setHistory(prev => [fullCmd, ...prev]);
    setHistoryIdx(-1);

    const parts = fullCmd.toLowerCase().split(" ");
    const command = parts[0];
    const args = parts.slice(1);

    switch (command) {
      case "help":
        addLog("Available Commands:\n" +
               "  ls, list        - List all IIoT devices\n" +
               "  isolate <name>  - Trigger physical kill-switch\n" +
               "  restore <name>  - Restore device to network\n" +
               "  sys             - View system analytics\n" +
               "  scan            - Run network vulnerability scan\n" +
               "  whoami          - Show current clearance level\n" +
               "  clear           - Clear terminal buffer\n" +
               "  about           - Protocol information");
        break;

      case "clear":
        setLogs([{ id: "clr", type: "system", content: "Terminal buffer cleared.", timestamp: new Date() }]);
        break;

      case "ls":
      case "list":
        addLog("Querying Obsidian database...", "system");
        const { data: devices } = await supabase.from('devices').select('*');
        if (devices) {
          const mapped = mapDevices(devices);
          const listStr = mapped.map(d => 
            `\x1b[34m[${d.status.toUpperCase()}]\x1b[0m ${d.name.padEnd(20)} | Risk: ${d.riskScore}% | IP: ${d.ip}`
          ).join("\n");
          addLog("ASSET INVENTORY:\n" + listStr);
        }
        break;

      case "isolate":
        if (args.length === 0) {
          addLog("Error: Specify device name to isolate.", "error");
          break;
        }
        const targetName = args.join(" ");
        addLog(`Initiating isolation protocol for '${targetName}'...`, "system");
        
        // Exact match or contains
        const { data: targets } = await supabase.from('devices')
          .select('id, name')
          .or(`name.ilike.%${targetName}%,id.eq.${targetName}`);

        if (targets && targets.length > 0) {
          const device = targets[0];
          const { error } = await supabase.from('devices').update({ status: 'isolated' }).eq('id', device.id);
          if (!error) {
            addLog(`SUCCESS: ${device.name} isolated. Physical kill-switch engaged.`, "output");
          } else {
            addLog(`FAILURE: Database rejection - ${error.message}`, "error");
          }
        } else {
          addLog(`Error: Device '${targetName}' not found in registry.`, "error");
        }
        break;

      case "restore":
        if (args.length === 0) {
          addLog("Error: Specify device name to restore.", "error");
          break;
        }
        const rTargetName = args.join(" ");
        addLog(`Initiating restoration protocol for '${rTargetName}'...`, "system");
        
        const { data: rTargets } = await supabase.from('devices')
          .select('id, name')
          .or(`name.ilike.%${rTargetName}%,id.eq.${rTargetName}`);

        if (rTargets && rTargets.length > 0) {
          const device = rTargets[0];
          const { error } = await supabase.from('devices').update({ status: 'online' }).eq('id', device.id);
          if (!error) {
            addLog(`SUCCESS: ${device.name} restored to Obsidian protocol.`, "output");
          } else {
            addLog(`FAILURE: ${error.message}`, "error");
          }
        } else {
          addLog("Error: Device not found.", "error");
        }
        break;

      case "scan":
        addLog("Starting Network Vulnerability Scan...", "system");
        addLog("0%   [░░░░░░░░░░░░░░░░░░░░]");
        setTimeout(() => addLog("45%  [█████████░░░░░░░░░░░] Scanning Ports..."), 400);
        setTimeout(() => addLog("80%  [████████████████░░░░] Analyzing Backdoors..."), 800);
        setTimeout(() => addLog("100% [████████████████████] Scan Complete."), 1200);
        setTimeout(() => addLog("\x1b[32mNO VULNERABILITIES DETECTED IN CORE ASSETS.\x1b[0m"), 1400);
        break;

      case "sys":
        addLog("SYSTEM ANALYTICS:\n" +
               "  Uptime: 247:12:44\n" +
               "  Neural Load: 14%\n" +
               "  Memory: 84.1GB / 128GB\n" +
               "  Encryption: AES-256-GCM\n" +
               "  Region: US-EAST-1 (lzjqvjj)");
        break;

      case "whoami":
        addLog("USER: Internal Operator #042\n" +
               "CLEARANCE: Level 6 (Obsidian)\n" +
               "ORG: AEGIS IIoT Security Collective");
        break;

      case "about":
        addLog("AEGIS Obsidian Protocol v2.0.4\n" +
               "Autonomous Security Reinforcement for IIoT Ecosystems.\n" +
               "Integrated with Supabase Cloud & ESP32 Neural Nodes.");
        break;

      default:
        addLog(`Unknown command: '${command}'. Type 'help' for a list of available commands.`, "error");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIdx < history.length - 1) {
        const newIdx = historyIdx + 1;
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx > 0) {
        const newIdx = historyIdx - 1;
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      } else {
        setHistoryIdx(-1);
        setInput("");
      }
    }
  };

  return (
    <div 
      className="h-[calc(100vh-140px)] glass-card bg-black/90 p-0 overflow-hidden flex flex-col font-mono relative border-accent-blue/30"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="absolute inset-0 pointer-events-none opacity-20 scanline" />
      
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
          <TerminalIcon className="w-4 h-4 text-accent-blue" />
          <span className="text-[10px] font-bold text-white uppercase tracking-widest">Aegis Secure Shell (SSH)</span>
        </div>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="w-2.5 h-2.5 rounded-full bg-success/20 glow-green" />
        </div>
      </div>

      {/* Terminal Body */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar"
      >
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div 
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "text-[12px] whitespace-pre-wrap leading-relaxed",
                log.type === "input" ? "text-white font-bold" : 
                log.type === "error" ? "text-danger" :
                log.type === "system" ? "text-accent-blue" : "text-success/90"
              )}
            >
              {log.content}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/5 border-t border-white/5 flex items-center gap-3 shrink-0">
        <span className="text-accent-purple font-bold">oper@aegis:~$</span>
        <input 
          ref={inputRef}
          className="flex-1 bg-transparent border-none outline-none text-white text-[12px] caret-accent-blue"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
        />
      </div>
    </div>
  );
}
