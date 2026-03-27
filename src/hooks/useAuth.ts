import { useState, useEffect } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { siemLogger } from '../lib/siemLogger';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveMode, setIsLiveMode] = useState(() => {
    // Force Demo Mode if Supabase is not configured
    if (!isSupabaseConfigured) return false;
    return localStorage.getItem("aegis_live_mode") === "true";
  });

  useEffect(() => {
    // If Supabase is not configured, we MUST stay in Demo Mode
    if (!isSupabaseConfigured && isLiveMode) {
      setIsLiveMode(false);
      return;
    }
    localStorage.setItem("aegis_live_mode", isLiveMode.toString());
  }, [isLiveMode]);

  useEffect(() => {
    const checkAuth = async () => {
      // Failover path: Missing config or Explicit Demo Mode
      if (!isLiveMode || !isSupabaseConfigured) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (err) {
        console.error("Auth Tunnel Error:", err);
        setIsAuthenticated(true); // Fallback to demo access on error
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isLiveMode) {
        setIsAuthenticated(!!session);
      }
    });

    return () => subscription.unsubscribe();
  }, [isLiveMode]);

  const toggleLiveMode = (val: boolean) => {
    setIsLiveMode(val);
    if (!val) {
      setIsAuthenticated(true);
    }
  };

  const logout = async () => {
    if (isLiveMode) {
      await supabase.auth.signOut();
    }
    setIsAuthenticated(false);
    siemLogger.log({
      event: 'LOGOUT',
      severity: 'INFO',
      source: 'useAuth',
      details: { mode: isLiveMode ? 'LIVE' : 'DEMO' }
    });
  };

  return {
    isAuthenticated,
    isLoading,
    isLiveMode,
    toggleLiveMode,
    logout,
    setIsAuthenticated
  };
}
