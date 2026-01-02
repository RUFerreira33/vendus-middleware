import { Router } from "express";
import { healthRouter } from "./health.js";
import { productsRouter } from "./products.js";
import { clientsRouter } from "./clients.js";
import { ordersRouter } from "./orders.js";

export const routes = Router();

routes.use("/orders", ordersRouter);
routes.use("/health", healthRouter);
routes.use("/products", productsRouter);
routes.use("/clients", clientsRouter);
