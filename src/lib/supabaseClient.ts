import { createClient } from '@supabase/supabase-js';

// These variables come from the .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Exporting a clear configuration status
export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey && (supabaseAnonKey.length > 50 && !supabaseAnonKey.includes("YOUR_CLOUD"));

// Single-use logger to avoid loops
let hasAlerted = false;
export const logSupabaseStatus = () => {
  if (!isSupabaseConfigured && !hasAlerted) {
    console.warn("🛡️ Aegis Security Info: Supabase not configured. Using Demo Mode.");
    hasAlerted = true;
  }
};

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co", 
  supabaseAnonKey || "placeholder_key"
);