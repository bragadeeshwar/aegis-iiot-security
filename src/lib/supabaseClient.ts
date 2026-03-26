import { createClient } from '@supabase/supabase-js';

// These variables come from the .env file you created earlier
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey.includes("YOUR_CLOUD")) {
  console.warn("🛡️ Aegis Security Alert: Supabase URL or Anon Key is missing or invalid. Live Cloud Auth will be disabled.");
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");