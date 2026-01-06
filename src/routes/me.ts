import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { supabaseAnon } from "../services/supabaseAnon.js";

export const meRouter = Router();

/**
 * GET /me
 * Com Bearer token do Supabase, devolve vendus_client_id
 * (RLS garante que só vê o registo dele)
 */
meRouter.get("/", asyncHandler(async (req, res) => {
  const auth = req.header("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";
  const supa = supabaseAnon();

  // valida token e usa-o para query com RLS
  const { data: userData, error: userErr } = await supa.auth.getUser(token);
  if (userErr || !userData?.user) {
    return res.status(401).json({ ok: false, error: "Invalid token" });
  }

  // cliente anon com token do utilizador (RLS)
  const supaUser = supabaseAnon();
  supaUser.auth.setSession({ access_token: token, refresh_token: "" } as any);

  const { data, error } = await supaUser
    .from("customer_accounts")
    .select("vendus_client_id,email,user_id,created_at")
    .eq("user_id", userData.user.id)
    .single();

  if (error) {
    return res.status(404).json({ ok: false, error: "Conta não associada", details: error });
  }

  return res.json({ ok: true, account: data });
}));
