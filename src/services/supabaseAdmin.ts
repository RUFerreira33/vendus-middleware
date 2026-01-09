import { createClient } from "@supabase/supabase-js";
import { ApiError } from "../errors.js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new ApiError(500, "SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY em falta");
}

export const supabaseAdmin = createClient(url, key, {
  auth: { persistSession: false },
});
