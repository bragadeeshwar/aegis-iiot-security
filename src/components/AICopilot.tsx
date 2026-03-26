import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Shield, 
  Zap, 
  Cpu,
  Terminal,
  MoreHorizontal,
  X,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { Message } from "../types";
import { supabase } from "../lib/supabaseClient";

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hello! I am your Aegis AI Security Copilot. I monitor your IIoT environment 24/7. How can I help you today?",
    timestamp: new Date().toLocaleTimeString(),
  },
  {
    id: "2",
    role: "assistant",
    content: "I've noticed a slight anomaly in the traffic pattern of PLC-04. Would you like me to analyze it for potential threats?",
    timestamp: new Date().toLocaleTimeString(),
  }
];

export default function AICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [liveStats, setLiveStats] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLiveStats = async () => {
      try {
        const { data: devices } = await supabase.from('devices').select('name, status');
        const { data: threats } = await supabase.from('threats').select('name, severity').limit(5);
        
        let stats = "Current System State: ";
        if (devices && devices.length > 0) stats += `Devices: ${devices.map(d => `${d.name}(${d.status})`).join(', ')}. `;
        if (threats && threats.length > 0) stats += `Recent Threats: ${threats.map(t => `${t.name}[${t.severity}]`).join(', ')}.`;
        setLiveStats(stats);
      } catch (e) {
        setLiveStats("System state currently unavailable.");
      }
    };
    fetchLiveStats();
  }, [isOpen]); // Refresh stats when chat opens

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Call live Groq API
    fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: `You are the Aegis AI Copilot, an expert Industrial IoT security system. ${liveStats} Keep answers very brief, highly technical, and focused on predictive maintenance, anomalies, and motor analysis. Output pure text, no markdown.` },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: "user", content: input }
        ]
      })
    })
    .then(r => r.json().then(data => ({ status: r.status, ok: r.ok, data })))
    .then(({ status, ok, data }) => {
      if (!ok) {
        throw new Error(data.error?.message || `HTTP ${status}`);
      }
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.choices?.[0]?.message?.content || "No intelligence retrieved.",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    })
    .catch(err => {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: `API Error: ${err.message}`, timestamp: new Date().toLocaleTimeString() }]);
      setIsTyping(false);
    });
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-accent-blue text-white flex items-center justify-center shadow-[0_0_20px_rgba(79,140,255,0.4)] z-50 transition-all duration-300 glow-blue",
          isOpen && "opacity-0 pointer-events-none scale-0"
        )}
      >
        <Sparkles className="w-6 h-6" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
            />

            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "fixed inset-y-0 right-0 z-[70] bg-bg-primary/95 backdrop-blur-xl border-l border-white/10 flex flex-col shadow-2xl transition-all duration-300 overflow-hidden",
                "w-full sm:w-[400px] lg:w-[450px]"
              )}
            >
              {/* Background Accents */}
              <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden opacity-30">
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent-blue/40 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-blue/15 rounded-full blur-[160px]" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-accent-blue/30 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
                
                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              </div>

              {/* Header */}
              <div className="p-6 border-b border-white/[0.06] flex items-center justify-between bg-bg-secondary/50 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent-blue rounded-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 glow-blue">
                    <Bot className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold text-white tracking-tight font-headline uppercase italic">Aegis AI Copilot</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-2 h-2 bg-success rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                      <span className="text-text-muted font-black text-[9px] uppercase tracking-[0.2em] font-label">Online & Monitoring</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2.5 bg-bg-secondary/50 hover:bg-bg-secondary/70 rounded-xl text-text-muted hover:text-text-primary transition-all duration-300 border border-white/[0.06]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 relative z-10 scroll-smooth custom-scrollbar pb-10">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-4 max-w-[90%]",
                      msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border transition-all duration-300",
                      msg.role === "assistant" ? "bg-accent-blue/10 border-accent-blue/20 text-accent-blue" : "bg-bg-secondary/50 border-white/[0.06] text-text-muted"
                    )}>
                      {msg.role === "assistant" ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div className="space-y-2">
                      <div className={cn(
                        "p-4 rounded-2xl text-sm leading-relaxed relative overflow-hidden",
                        msg.role === "assistant" ? "bg-bg-secondary/30 text-text-primary border border-white/[0.06]" : "bg-accent-blue text-white shadow-[0_0_20px_rgba(79,140,255,0.2)]"
                      )}>
                        {msg.content}
                      </div>
                      <p className={cn("text-[9px] text-text-muted font-black uppercase tracking-[0.2em] font-label", msg.role === "user" ? "text-right" : "")}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex gap-4 max-w-[90%]">
                    <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center bg-accent-blue/10 border border-accent-blue/20 text-accent-blue">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="bg-bg-secondary/30 border border-white/[0.06] p-4 rounded-2xl flex gap-1.5">
                      <div className="w-2 h-2 bg-accent-blue/40 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-accent-blue/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 bg-accent-blue/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-6 border-t border-white/[0.06] bg-bg-secondary/10 relative z-10">
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 custom-scrollbar no-scrollbar -mx-2 px-2">
                  {["Analyze PLC-04", "System Health", "Recent Alerts", "Threat Report"].map((suggestion) => (
                    <button 
                      key={suggestion} 
                      onClick={() => setInput(suggestion)}
                      className="px-4 py-2 bg-bg-secondary/50 hover:bg-bg-secondary/70 border border-white/[0.06] rounded-xl text-[9px] text-text-muted hover:text-text-primary font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300 font-label"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <div className="relative group/input">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask Aegis anything..." 
                    className="w-full bg-bg-secondary/50 border border-white/[0.06] rounded-2xl py-4 pl-6 pr-16 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/30 transition-all duration-300"
                  />
                  <button 
                    onClick={handleSend}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-accent-blue hover:bg-blue-600 text-white rounded-xl shadow-lg transition-all duration-300 active:scale-95 glow-blue"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
