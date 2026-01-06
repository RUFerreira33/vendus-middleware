import { createClient } from "@supabase/supabase-js";
import { ApiError } from "../errors.js";

export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new ApiError(500, "SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY em falta");

  return createClient(url, key, { auth: { persistSession: false } });
}
