import { Router } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { ClientsService } from "../services/clientsService.js";
import { AccountsService } from "../services/accountsService.js";
import { supabaseAnon } from "../services/supabaseAnon.js";

export const authRouter = Router();
const clients = new ClientsService();
const accounts = () => new AccountsService();

/**
 * POST /auth/register
 * Cria/obtém cliente Vendus, cria user Supabase, grava ligação em customer_accounts
 */
authRouter.post("/register", asyncHandler(async (req, res) => {
  if (!req.is("application/json")) {
    return res.status(415).json({ ok: false, error: "Content-Type must be application/json" });
  }

  const { nome, email, telefone, nif, password } = req.body || {};

  if (!nome) {
    return res.status(400).json({ ok: false, error: "nome é obrigatório" });
  }

  if (!email) {
    return res.status(400).json({ ok: false, error: "email é obrigatório" });
  }

  if (!password) {
    return res.status(400).json({ ok: false, error: "password é obrigatório" });
  }

  // ✅ AQUI ESTÁ A CORREÇÃO
  if (!nif) {
    return res.status(400).json({
      ok: false,
      error: "nif é obrigatório para criar clientes na Vendus"
    });
  }

  // 1) Vendus: cria ou encontra cliente
  const r = await clients.createIfNotExists({ nome, email, telefone, nif });
  const vendusClientId = r.clientId;

  // 2) Supabase: cria user + guarda link
  const acc = await accounts().createUserAndLink({
    email,
    password,
    vendusClientId
  });

  return res.json({
    ok: true,
    created_client: r.created,
    vendusClientId,
    supabaseUserId: acc.user_id
  });
}));

/**
 * POST /auth/login
 * Retorna access_token do Supabase
 */
authRouter.post("/login", asyncHandler(async (req, res) => {
  if (!req.is("application/json")) {
    return res.status(415).json({ ok: false, error: "Content-Type must be application/json" });
  }

  const { email, password } = req.body || {};
  const supa = supabaseAnon();

  const { data, error } = await supa.auth.signInWithPassword({
    email: (email || "").trim().toLowerCase(),
    password: password || ""
  });

  if (error || !data?.session) {
    return res.status(401).json({ ok: false, error: "Login inválido", details: error ?? undefined });
  }

  return res.json({
    ok: true,
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: data.user
  });
}));
