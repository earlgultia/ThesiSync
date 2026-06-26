import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Allow a local override to bypass Supabase during UI testing.
// Set VITE_BYPASS_SUPABASE=1 in your env to force the app into "no-backend" mode.
const bypassFlag = Boolean(import.meta.env.VITE_BYPASS_SUPABASE);

export const isSupabaseConfigured =
  !bypassFlag &&
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes("your_supabase") &&
  !supabaseAnonKey.includes("your_supabase") &&
  !supabaseAnonKey.includes("your-public");

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : "https://placeholder.supabase.co",
  isSupabaseConfigured ? supabaseAnonKey : "placeholder-anon-key",
);
