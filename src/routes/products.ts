import { Router } from "express";
import { ProductsService } from "../services/productsService.js";
import { pickQuery, toQueryString } from "../http.js";

export const productsRouter = Router();
const service = new ProductsService();

productsRouter.get("/", async (req, res) => {
  const params = pickQuery(req, [
    "q","ids","title","store_id","reference","barcode","category_id","brand_id","status","type",
    "per_page","page"
  ]);
  const qs = toQueryString(params);
  const products = await service.list(qs);
  res.json({ ok: true, products });
});

productsRouter.get("/:id", async (req, res) => {
  const product = await service.getById(req.params.id);
  res.json({ ok: true, product });
});
