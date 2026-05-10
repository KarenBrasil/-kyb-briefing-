import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Faltam variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY no .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
