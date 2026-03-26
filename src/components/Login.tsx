import React, { useState } from "react";
import { Shield, Lock, Mail, ArrowRight, Github, Chrome, Loader2, AlertCircle, CheckCircle2, Globe, WifiOff, Cloud, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabaseClient";
import { siemLogger } from "../lib/siemLogger";
import { useAuth } from "../hooks/useAuth";

interface LoginProps {
  onLogin: () => void;
  onToggleMode: () => void;
}

export default function Login({ onLogin, onToggleMode }: LoginProps) {
  const { isLiveMode, toggleLiveMode } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSocialLoading, setIsSocialLoading] = useState<string | null>(null);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoverySent, setRecoverySent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showMockAuth, setShowMockAuth] = useState<string | null>(null); // 'google' | 'github' | null
  
  const isKeyPlaceholder = import.meta.env.VITE_SUPABASE_ANON_KEY?.includes("YOUR_CLOUD");

  // Recovery Simulation
  const handleRecovery = () => {
    setRecoverySent(true);
    setTimeout(() => setRecoverySent(false), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEmailLoading(true);
    setError(null);

    // Automatic check for workability
    if (!isLiveMode || isKeyPlaceholder) {
      if (isLiveMode && isKeyPlaceholder) {
        setError("Live Cloud requires valid keys in .env.local. Falling back to Demo Mode.");
        toggleLiveMode(false);
        setIsEmailLoading(false);
        return;
      }
      siemLogger.logAuth(email || "demo_user", 'login', true);
      onLogin(); 
      setIsEmailLoading(false);
      return;
    }

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        siemLogger.logAuth(email, 'login', false);
        setError(authError.message);
      } else {
        siemLogger.logAuth(email, 'login', true);
        onLogin(); // Immediate Transition
      }
    } catch (err) {
      setError("Network unresponsive. Is Cloud Auth actually configured?");
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setIsSocialLoading(provider);
    setError(null);

    if (!isLiveMode || isKeyPlaceholder) {
      if (isLiveMode && isKeyPlaceholder) {
        setError("Live Cloud requires valid keys in .env.local. Configure your .env to enable production social auth.");
        setIsSocialLoading(null);
        return;
      }
      
      // Simulate OAuth Process
      setShowMockAuth(provider);
      return;
    }

    let timeoutId: any;
    
    if (isLiveMode) {
      timeoutId = setTimeout(() => {
        if (isSocialLoading) {
          setError("OAuth Handshake timed out. Check your configurations.");
          setIsSocialLoading(null);
        }
      }, 6000); 
    }

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin
        }
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (authError) {
        siemLogger.logAuth(provider, 'social_login', false);
        setError(`Auth Failed: ${authError.message}`);
        setIsSocialLoading(null);
      } else {
        siemLogger.logAuth(provider, 'social_login', true);
      }
    } catch (err) {
      if (timeoutId) clearTimeout(timeoutId);
      setError("Cloud Identity Tunnel closed. Check your Supabase URL & Anon Key.");
      setIsSocialLoading(null);
    }
  };

  const handleMockApprove = () => {
    const provider = showMockAuth;
    setShowMockAuth(null);
    setIsSocialLoading(provider);
    
    setTimeout(() => {
      if (provider) siemLogger.logAuth(provider, 'social_login', true);
      onLogin();
      setIsSocialLoading(null);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      {/* Mock Auth Overlay for Demo */}
      <AnimatePresence>
        {showMockAuth && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md bg-black/60"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm glass-card p-6 border-accent-blue/30 overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-accent-blue animate-pulse" />
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-white/5">
                  {showMockAuth === 'google' ? <Chrome className="w-5 h-5 text-[#4285F4]" /> : <Github className="w-5 h-5 text-white" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white capitalize">{showMockAuth} Identity Provider</h3>
                  <p className="text-[10px] text-text-muted">Simulated External Authorization</p>
                </div>
              </div>
              
              <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-6">
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Aegis Security is requesting access to your <span className="text-white font-bold">{showMockAuth}</span> identity token for session provisioning. This is a simulated environment.
                </p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => { setShowMockAuth(null); setIsSocialLoading(null); }}
                  className="flex-1 py-2.5 rounded-lg border border-white/10 text-[10px] font-bold text-text-muted hover:bg-white/5 transition-all text-center"
                >
                  CANCEL
                </button>
                <button 
                  onClick={handleMockApprove}
                  className="flex-1 py-2.5 rounded-lg bg-accent-blue text-white text-[10px] font-bold shadow-[0_0_15px_rgba(79,140,255,0.3)] hover:scale-[1.02] transition-all text-center uppercase tracking-widest"
                >
                  Approve Access
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 cyber-grid" />
        <div className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] bg-accent-blue/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-accent-purple/10 blur-[150px] rounded-full animate-pulse delay-700" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[440px] relative z-10"
      >
        <div className="glass-card p-8 md:p-10 relative overflow-hidden">
          {/* Top Secure Indicator */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-blue via-accent-purple to-accent-blue animate-shimmer" />
          
          <div className="flex flex-col items-center mb-10">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-16 h-16 bg-accent-blue rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(79,140,255,0.4)] mb-6 glow-blue relative"
            >
              <Shield className="w-8 h-8 text-white relative z-10" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white tracking-tighter mb-2 font-headline uppercase italic">AEGIS IIOT</h1>
            <div className="flex items-center gap-2 mb-6 font-label">
              <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
              <p className="text-[10px] text-text-muted uppercase tracking-[0.3em] font-black">Secure Gateway Active</p>
            </div>

            {/* LIVE/DEMO Toggle */}
            <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/5 backdrop-blur-xl font-label">
              <button 
                onClick={() => toggleLiveMode(false)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!isLiveMode ? 'bg-accent-blue text-white shadow-[0_0_15px_rgba(0,251,251,0.3)]' : 'text-text-muted hover:text-text-secondary'}`}
              >
                <WifiOff className="w-4 h-4" />
                Demo 
              </button>
              <button 
                onClick={() => toggleLiveMode(true)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isLiveMode ? 'bg-accent-purple text-white shadow-[0_0_15px_rgba(255,170,247,0.3)]' : 'text-text-muted hover:text-text-secondary'}`}
              >
                <Cloud className="w-4 h-4" />
                Live 
              </button>
            </div>
            {isKeyPlaceholder && isLiveMode && (
              <p className="text-[8px] text-warning uppercase font-bold tracking-widest mt-4 animate-pulse">
                Configuration Required in .env.local
              </p>
            )}
            {!isLiveMode && (
              <p className="text-[8px] text-accent-blue uppercase font-bold tracking-widest mt-4 animate-pulse">
                Instant Access Protocol Enabled
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-destructive/10 border border-destructive/20 text-destructive text-[10px] py-3 px-4 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </motion.div>
              )}
              {recoverySent && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-success/10 border border-success/20 text-success text-[10px] py-3 px-4 rounded-xl font-bold uppercase tracking-wider flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Recovery identity token sent to email
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2 font-label">
              <label className="text-[9px] text-text-muted uppercase font-black tracking-[0.2em] ml-2">Internal Identity (Email)</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent-blue transition-colors duration-300" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@aegis.security"
                  className="input-field w-full pl-12"
                  disabled={isEmailLoading || !!isSocialLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-2 font-label">
                <label className="text-[9px] text-text-muted uppercase font-black tracking-[0.2em]">Security Key (Password)</label>
                <button 
                  type="button" 
                  onClick={handleRecovery}
                  className="text-[9px] text-accent-blue hover:text-blue-400 font-bold uppercase tracking-widest transition-colors"
                >
                  Recovery
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent-blue transition-colors duration-300" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field w-full pl-12 pr-12"
                  disabled={isEmailLoading || !!isSocialLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-accent-blue transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isEmailLoading}
              className="btn-primary w-full flex items-center justify-center gap-3 group disabled:opacity-50 transition-all py-4"
            >
              <span className="relative z-10 flex items-center gap-2 font-bold uppercase tracking-widest text-xs text-white">
                {isEmailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Authorize Access"}
                {!isEmailLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </span>
            </button>
          </form>

          <div className="mt-10">
            <div className="relative flex items-center justify-center mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <span className="relative px-4 bg-bg-primary text-[9px] text-text-muted uppercase font-black tracking-[0.3em]">External Identity Link</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleSocialLogin('google')}
                disabled={!!isSocialLoading}
                className="btn-secondary flex items-center justify-center gap-3 py-3"
              >
                {isSocialLoading === 'google' ? <Loader2 className="w-4 h-4 animate-spin " /> : <Chrome className="w-4 h-4 text-[#4285F4]" />}
                Google
              </button>
              <button 
                onClick={() => handleSocialLogin('github')}
                disabled={!!isSocialLoading}
                className="btn-secondary flex items-center justify-center gap-3 py-3"
              >
                {isSocialLoading === 'github' ? <Loader2 className="w-4 h-4 animate-spin " /> : <Github className="w-4 h-4 text-white" />}
                GitHub
              </button>
            </div>
          </div>

          <p className="mt-10 text-center text-text-secondary text-[11px] font-medium">
            New Operator?{" "}
            <button 
              onClick={onToggleMode}
              className="text-accent-blue hover:text-blue-400 font-bold transition-colors underline underline-offset-8"
            >
              Request Provisioning
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
