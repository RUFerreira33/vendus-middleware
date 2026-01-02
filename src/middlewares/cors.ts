import type { Request, Response, NextFunction } from "express";
import { getConfig } from "../config.js";

function computeAllowOrigin(req: Request) {
  const { ALLOWED_ORIGINS } = getConfig();
  const allowed = ALLOWED_ORIGINS.split(",").map(s => s.trim()).filter(Boolean);
  const origin = req.headers.origin || "";

  if (allowed.includes("*")) return "*";
  if (origin && allowed.includes(origin)) return origin;
  return allowed[0] || "";
}

export function cors(req: Request, res: Response, next: NextFunction) {
  const allowOrigin = computeAllowOrigin(req);

  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") return res.status(204).send();
  next();
}
