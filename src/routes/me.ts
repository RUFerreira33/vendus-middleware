import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { ApiError } from "../errors.js";
import { supabaseAnon } from "../services/supabaseAnon.js";
import { supabaseAdmin } from "../services/supabaseAdmin.js";

export const meRouter = Router();

/**
 * GET /me
 * Bearer token do Supabase -> devolve customer_accounts do user
 */
meRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const auth = req.header("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";

    if (!token) throw new ApiError(401, "Missing Bearer token");

    // 1) validar token com ANON
    const anon = supabaseAnon();
    const { data: userData, error: userErr } = await anon.auth.getUser(token);

    if (userErr || !userData?.user) {
      return res.status(401).json({ ok: false, error: "Invalid token", details: userErr ?? undefined });
    }

    const admin = supabaseAdmin();

    const { data, error } = await admin
      .from("customer_accounts")
      .select("vendus_client_id,email,user_id,created_at,tipo_utilizador")
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (error) {
      return res.status(502).json({ ok: false, error: "Erro a ler customer_accounts", details: error.message });
    }

    if (!data) {
      return res.status(404).json({ ok: false, error: "Conta não associada" });
    }

    return res.json({ ok: true, account: data });
  })
);
