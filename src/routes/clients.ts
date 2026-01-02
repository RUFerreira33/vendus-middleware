import { Router } from "express";
import { ClientsService } from "../services/clientsService.js";
import { pickQuery, toQueryString } from "../http.js";

export const clientsRouter = Router();
const service = new ClientsService();

clientsRouter.get("/", async (req, res) => {
  const params = pickQuery(req, [
    "q","fiscal_id","name","email","external_reference","status","date",
    "per_page","page"
  ]);
  const qs = toQueryString(params);
  const clients = await service.list(qs);
  res.json({ ok: true, clients });
});

clientsRouter.get("/:id", async (req, res) => {
  const client = await service.getById(req.params.id);
  res.json({ ok: true, client });
});

// “igual ao teu /customers”: cria se não existir e devolve id
clientsRouter.post("/", async (req, res) => {
  const { nome, email, telefone, nif } = req.body || {};
  const result = await service.createIfNotExists({ nome, email, telefone, nif });
  res.json({ ok: true, ...result });
});
