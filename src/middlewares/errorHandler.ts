import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../errors.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);

  if (err instanceof ApiError) {
    return res.status(err.status).json({
      ok: false,
      error: err.message,
      details: err.details ?? undefined
    });
  }

  return res.status(500).json({ ok: false, error: "Internal Server Error" });
}
