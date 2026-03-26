import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { siemLogger } from '../lib/siemLogger';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveMode, setIsLiveMode] = useState(() => {
    return localStorage.getItem("aegis_live_mode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("aegis_live_mode", isLiveMode.toString());
  }, [isLiveMode]);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLiveMode) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setIsLoading(false);
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
