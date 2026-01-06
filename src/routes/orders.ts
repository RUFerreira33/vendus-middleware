import { Router } from "express";
import { OrdersService } from "../services/ordersService.js";
import { pickQuery, toQueryString } from "../http.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

export const ordersRouter = Router();
const service = new OrdersService();

// GET /orders -> lista encomendas (documents type=EC)
ordersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const params = pickQuery(req, [
      "store_id",
      "register_id",
      "client_id",
      "client_fiscal_id",
      "client_country",
      "subtype",
      "since",
      "until",
      "q",
      "external_reference",
      "status",
      "view",
      "mode",
      "per_page",
      "page",
    ]);

    // força sempre type=EC (Encomenda)
    params["type"] = "EC";

    const qs = toQueryString(params);
    const orders = await service.list(qs);
    return res.json({ ok: true, orders });
  })
);

// GET /orders/:id -> detalhe
ordersRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const params = pickQuery(req, [
      "mode",
      "copies",
      "output",
      "output_template_id",
      "output_version",
      "return_qrcode",
      "download",
      "force_template",
      "register_id",
    ]);
    const qs = toQueryString(params);

    const order = await service.getById(req.params.id, qs);

    // normalizar client_id para robôs / integrações
    const client_id = order?.client?.id ?? order?.client_id ?? null;

    return res.json({
      ok: true,
      order: {
        ...(order || {}),
        client_id,
      },
    });
  })
);

// POST /orders -> cria encomenda (type EC)
ordersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    if (!req.is("application/json")) {
      return res
        .status(415)
        .json({ ok: false, error: "Content-Type must be application/json" });
    }

    const created = await service.create(req.body);
    return res.json({ ok: true, created });
  })
);
