import express from "express";
import { cors } from "./middlewares/cors.js";
import { requireInternalKey } from "./middlewares/requireInternalKey.js";
import { errorHandler } from "./middlewares/errorHandler.js";


import { routes } from "./routes/index.js";          // rotas internas (health/products/clients/orders...)
import { authRouter } from "./routes/auth.js";       // /auth/register e /auth/login
import { meRouter } from "./routes/me.js";           // /me
import { requireSupabaseJwt } from "./middlewares/requireSupabaseJWT.js"; // middleware de autenticação Supabase JWT
import { paymentsRouter } from "./routes/payments.js";
export const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(cors);

app.use("/auth", authRouter);

app.use("/me", requireSupabaseJwt, meRouter);

app.use(requireInternalKey);
app.use("/", routes);

import { debugRouter } from "./routes/debug.js";
app.use("/debug", debugRouter);

app.use("/payments", paymentsRouter);
app.use(errorHandler);
