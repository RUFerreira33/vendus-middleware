import type { Request, Response, NextFunction } from "express";
import { supabaseAnon } from "../services/supabaseAnon.js";

export async function requireSupabaseJwt(req: Request, res: Response, next: NextFunction) {
  const auth = req.header("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : "";

  if (!token) return res.status(401).json({ ok: false, error: "Missing Bearer token" });

  const supa = supabaseAnon();
  const { data, error } = await supa.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(401).json({ ok: false, error: "Invalid token" });
  }

  (req as any).user = data.user;
  return next();
}
