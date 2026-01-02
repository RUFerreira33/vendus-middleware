import type { Request, Response, NextFunction } from "express";
import { getConfig } from "../config.js";

export function requireInternalKey(req: Request, res: Response, next: NextFunction) {
  try {
    const { INTERNAL_API_KEY } = getConfig();
    const provided = req.header("x-api-key") || "";

    if (provided !== INTERNAL_API_KEY) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    next();
  } catch {
    return res.status(500).json({ ok: false, error: "Server misconfigured" });
  }
}
