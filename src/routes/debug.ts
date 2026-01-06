import { Router } from "express";

export const debugRouter = Router();

debugRouter.get("/env", (req, res) => {
  res.json({
    ok: true,
    has_SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    has_SUPABASE_ANON_KEY: Boolean(process.env.SUPABASE_ANON_KEY),
    has_SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    // não devolver valores, só booleans
  });
});
