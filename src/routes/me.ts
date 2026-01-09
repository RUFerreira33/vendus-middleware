import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { ApiError } from "../errors.js";
import { supabaseAdmin } from "../services/supabaseAdmin.js";

export const meRouter = Router();

/**
 * GET /me
 * Com Bearer token do Supabase, devolve vendus_client_id
 * (valida token e lê customer_accounts via service role)
 */
meRouter.get("/", asyncHandler(async (req, res) => {
  const auth = req.header("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";

  if (!token) throw new ApiError(401, "Missing Bearer token");

  const admin = supabaseAdmin();

  // 1) validar token e obter user
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return res.status(401).json({ ok: false, error: "Invalid token", details: userErr ?? undefined });
  }

  // 2) buscar associação (não usar .single)
  const { data, error } = await admin
    .from("customer_accounts")
    .select("vendus_client_id,email,user_id,created_at")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ ok: false, error: "Erro a ler customer_accounts", details: error });
  }

  if (!data) {
    return res.status(404).json({ ok: false, error: "Conta não associada" });
  }

  return res.json({ ok: true, account: data });
}));
