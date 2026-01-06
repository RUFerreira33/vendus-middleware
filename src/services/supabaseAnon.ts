import { createClient } from "@supabase/supabase-js";
import { ApiError } from "../errors.js";

export function supabaseAnon() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new ApiError(500, "SUPABASE_URL/SUPABASE_ANON_KEY em falta");

  return createClient(url, key, { auth: { persistSession: false } });
}
