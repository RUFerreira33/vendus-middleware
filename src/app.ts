import express from "express";
import { routes } from "./routes/index.js";
import { cors } from "./middlewares/cors.js";
import { requireInternalKey } from "./middlewares/requireInternalKey.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export const app = express();

app.use(express.json({ limit: "1mb" }));
app.use(cors);

// proteção do middleware (PowerApps/UIPath/Postman enviam x-api-key)
app.use(requireInternalKey);

app.use("/", routes);

app.use(errorHandler);
