import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./components/Dashboard";
import DeviceManagement from "./components/DeviceManagement";
import NetworkVisualization from "./components/NetworkVisualization";
import ThreatCenter from "./components/ThreatCenter";
import AttackSimulation from "./components/AttackSimulation";
import ZeroTrust from "./components/ZeroTrust";
import AICopilot from "./components/AICopilot";
import Reports from "./components/Reports";
import Settings from "./components/Settings";
import { siemLogger } from "./lib/siemLogger";
import Terminal from "./components/Terminal";
import Login from "./components/Login";
import Register from "./components/Register";
import PageTransition from "./components/PageTransition";
import { cn } from "./lib/utils";
import { supabase } from "./lib/supabaseClient";
import { Shield, Loader2 } from "lucide-react";
import { useAuth } from "./hooks/useAuth";

const ProtectedRoute = ({ children, isAuthenticated, isLoading }: { children: React.ReactNode, isAuthenticated: boolean, isLoading: boolean }) => {
  if (isLoading) return null; // Wait for auth check
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// @ts-ignore
class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false };

  constructor(props: any) {
    super(props);
  }

  static getDerivedStateFromError(_: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Aegis Component Crash:", error, errorInfo);
    // @ts-ignore
    siemLogger.log({
      event: 'COMPONENT_CRASH',
      severity: 'CRITICAL',
      source: 'ErrorBoundary',
      details: { error: error.toString(), info: errorInfo.componentStack }
    });
  }

  render() {
    // @ts-ignore
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-bg-primary text-text-primary p-8 text-center">
          <shield-alert-icon className="w-16 h-16 text-danger mb-6 animate-pulse" />
          <h2 className="text-2xl font-bold font-headline uppercase mb-4 tracking-tight">Security Kernel Panic</h2>
          <p className="max-w-md text-text-secondary text-sm mb-8 leading-relaxed">
            A critical system component has failed. The Aegis kernel has intercepted the crash to prevent data leakage.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary px-8 py-3"
          >
            Re-Initialize Systems
          </button>
        </div>
      );
    }
    // @ts-ignore
    return this.props.children;
  }
}

const AppContent = () => {
  const { isAuthenticated, isLoading, logout, setIsAuthenticated } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Handle Redirection
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isAuthPage) {
      navigate("/login");
    } else if (!isLoading && isAuthenticated && isAuthPage) {
      navigate("/");
    }
  }, [isAuthenticated, isLoading, isAuthPage, navigate]);

  if (isLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-bg-primary text-text-primary">
        <Loader2 className="w-12 h-12 text-accent-blue animate-spin mb-6" />
        <p className="text-xs font-bold uppercase tracking-widest text-text-muted animate-pulse">Establishing Secure Tunnel...</p>
      </div>
    );
  }

  const handleLogin = () => {
    setIsAuthenticated(true);
    navigate("/");
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary selection:bg-accent-blue/30 font-body overflow-x-hidden relative">
      {/* ── Premium Background System ─────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Cyber grid base */}
        <div className="absolute inset-0 cyber-grid cyber-grid-animate" />
        {/* Top-left ambient orb */}
        <div className="absolute -top-48 -left-48 w-[600px] h-[600px] bg-accent-blue/[0.04] rounded-full blur-[120px] cyber-pulse" />
        {/* Bottom-right ambient orb */}
        <div className="absolute -bottom-48 -right-24 w-[500px] h-[500px] bg-accent-purple/[0.05] rounded-full blur-[120px] cyber-pulse" style={{ animationDelay: '3s' }} />
        {/* Center subtle glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-accent-blue/[0.025] rounded-full blur-[160px]" />
        {/* Scanline effect */}
        <div className="scanline opacity-40" />
      </div>

      {!isAuthPage && isAuthenticated && (
        <Sidebar 
          onLogout={handleLogout} 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
        />
      )}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {!isAuthPage && isAuthenticated && (
          <Header 
            onLogout={handleLogout} 
            onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          />
        )}
        <main className={cn("flex-1 overflow-y-auto custom-scrollbar", !isAuthPage && isAuthenticated ? "px-4 md:px-8 pb-8" : "")}>
          <div className={cn(!isAuthPage && isAuthenticated ? "max-w-[1400px] mx-auto w-full pt-6" : "h-full")}>
            <AnimatePresence mode="wait">
              <motion.div 
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                <Routes location={location as any}>
                <Route 
                  path="/login" 
                  element={
                    <PageTransition>
                      {isAuthenticated ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} onToggleMode={() => navigate("/register")} />}
                    </PageTransition>
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    <PageTransition>
                      {isAuthenticated ? <Navigate to="/" replace /> : <Register onRegister={handleLogin} onToggleMode={() => navigate("/login")} />}
                    </PageTransition>
                  } 
                />
                
                <Route path="/" element={
                  <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
                    <PageTransition><Dashboard /></PageTransition>
                  </ProtectedRoute>
                } />
                <Route path="/devices" element={
                  <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
                    <PageTransition><DeviceManagement /></PageTransition>
                  </ProtectedRoute>
                } />
                <Route path="/network" element={
                  <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
                    <PageTransition><NetworkVisualization /></PageTransition>
                  </ProtectedRoute>
                } />
                <Route path="/threats" element={
                  <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
                    <PageTransition><ThreatCenter /></PageTransition>
                  </ProtectedRoute>
                } />
                <Route path="/simulation" element={
                  <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
                    <PageTransition><AttackSimulation /></PageTransition>
                  </ProtectedRoute>
                } />
                <Route path="/zero-trust" element={
                  <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
                    <PageTransition><ZeroTrust /></PageTransition>
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
                    <PageTransition><Reports /></PageTransition>
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
                    <PageTransition><Settings /></PageTransition>
                  </ProtectedRoute>
                } />
                <Route path="/terminal" element={
                  <ProtectedRoute isAuthenticated={isAuthenticated} isLoading={isLoading}>
                    <PageTransition><Terminal /></PageTransition>
                  </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
          </div>
        </main>
        {!isAuthPage && isAuthenticated && <AICopilot />}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </Router>
  );
}
