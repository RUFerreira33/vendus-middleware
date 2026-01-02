import { Router } from "express";
import { ClientsService } from "../services/clientsService.js";
import { pickQuery, toQueryString } from "../http.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

export const clientsRouter = Router();
const service = new ClientsService();

clientsRouter.get("/", asyncHandler(async (req, res) => {
  const params = pickQuery(req, [
    "q","fiscal_id","name","email","external_reference","status","date",
    "per_page","page"
  ]);
  const qs = toQueryString(params);
  const clients = await service.list(qs);
  return res.json({ ok: true, clients });
}));

clientsRouter.get("/:id", asyncHandler(async (req, res) => {
  const client = await service.getById(req.params.id);
  return res.json({ ok: true, client });
}));

clientsRouter.post("/", asyncHandler(async (req, res) => {
  const { nome, email, telefone, nif } = req.body || {};
  const result = await service.createIfNotExists({ nome, email, telefone, nif });
  return res.json({ ok: true, ...result });
}));
