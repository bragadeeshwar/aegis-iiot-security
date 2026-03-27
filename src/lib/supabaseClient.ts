import { createClient } from '@supabase/supabase-js';

// These variables come from the .env file you created earlier
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey && !supabaseAnonKey.includes("YOUR_CLOUD");

if (!isSupabaseConfigured) {
  console.warn("🛡️ DEBUG_VERIFY_BUILD_715: Supabase URL or Anon Key is missing or invalid.");
}

export const supabase = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder");