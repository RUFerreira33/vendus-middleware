import { Router } from "express";
import { healthRouter } from "./health.js";
import { productsRouter } from "./products.js";
import { clientsRouter } from "./clients.js";

export const routes = Router();

routes.use("/health", healthRouter);
routes.use("/products", productsRouter);
routes.use("/clients", clientsRouter);
