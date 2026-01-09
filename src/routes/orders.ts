import { Router } from "express";
import { OrdersService } from "../services/ordersService.js";
import { pickQuery, toQueryString } from "../http.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { supabaseAdmin } from "../services/supabaseAdmin.js";

export const ordersRouter = Router();
const service = new OrdersService();

/**
 * GET /orders -> lista encomendas (Vendus) (type=EC)
 */
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

    params["type"] = "EC";

    const qs = toQueryString(params);
    const orders = await service.list(qs);
    return res.json({ ok: true, orders });
  })
);

/**
 * GET /orders/enriched -> lista encomendas com dados do cliente garantidos (robô)
 */
ordersRouter.get(
  "/enriched",
  asyncHandler(async (req, res) => {
    const params = pickQuery(req, [
      "store_id",
      "register_id",
      "subtype",
      "since",
      "until",
      "q",
      "external_reference",
      "status",
      "mode",
      "per_page",
      "page",
    ]);

    params["type"] = "EC";

    const qs = toQueryString(params);
    const orders = await service.list(qs);

    const enriched = await Promise.all(
      orders.map(async (o: any) => {
        try {
          const detail = await service.getById(String(o.id));
          const client_id = detail?.client?.id ?? detail?.client_id ?? o.client_id ?? null;
          const client_name = detail?.client?.name ?? o.client_name ?? "Consumidor Final";
          let client_email = detail?.client?.email ?? "";

          if (!client_email && client_id) {
            try {
              const clientProfile = await service.vendus.get<any>(`/clients/${client_id}`);
              client_email = clientProfile?.email ?? "";
            } catch {
              // ignore
            }
          }

          return {
            ...o,
            client_id,
            client_name,
            client_email,
          };
        } catch {
          return {
            ...o,
            client_id: o.client_id ?? null,
            client_name: "Erro ao obter detalhe",
            client_email: "",
          };
        }
      })
    );

    return res.json({ ok: true, orders: enriched });
  })
);

/**
 * ==============================
 *  PENDENTES (SUPABASE) - FILA
 * ==============================
 *
 * Estas rotas têm de vir ANTES do "/:id"
 */

/**
 * GET /orders/pending -> lista pedidos pendentes no Supabase
 */
ordersRouter.get(
  "/pending",
  asyncHandler(async (_req, res) => {
    const { data, error } = await supabaseAdmin
      .from("pending_orders")
      .select("id, created_at, status, client_name, client_email, amount_gross, vendus_document_id")
      .eq("status", "PENDING")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(502).json({ ok: false, error: "Erro Supabase", details: error.message });
    }

    return res.json({ ok: true, orders: data ?? [] });
  })
);

/**
 * POST /orders/pending/:id/accept
 * - lê o payload do Supabase
 * - cria no Vendus (EC)
 * - marca ACCEPTED e guarda vendus_document_id
 */
ordersRouter.post(
  "/pending/:id/accept",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const acceptedBy = req.body?.accepted_by ?? "funcionario";

    const { data: pending, error: e1 } = await supabaseAdmin
      .from("pending_orders")
      .select("id, status, payload")
      .eq("id", id)
      .single();

    if (e1 || !pending) {
      return res.status(404).json({ ok: false, error: "Pedido pendente não encontrado" });
    }

    if (pending.status !== "PENDING") {
      return res.status(409).json({ ok: false, error: `Pedido já está em ${pending.status}` });
    }

    // cria no Vendus (AGORA SIM)
    const created = await service.create(pending.payload);

    const { error: e2 } = await supabaseAdmin
      .from("pending_orders")
      .update({
        status: "ACCEPTED",
        vendus_document_id: created?.id ?? null,
        accepted_at: new Date().toISOString(),
        accepted_by: acceptedBy,
      })
      .eq("id", id);

    if (e2) {
      return res.status(502).json({ ok: false, error: "Erro ao atualizar Supabase", details: e2.message });
    }

    return res.json({ ok: true, created });
  })
);

/**
 * POST /orders/pending/:id/reject
 * - marca REJECTED
 * - NUNCA cria no Vendus
 */
ordersRouter.post(
  "/pending/:id/reject",
  asyncHandler(async (req, res) => {
    const id = req.params.id;
    const rejectedBy = req.body?.rejected_by ?? "funcionario";
    const reason = req.body?.reason ?? null;

    const { data: pending, error: e1 } = await supabaseAdmin
      .from("pending_orders")
      .select("id, status")
      .eq("id", id)
      .single();

    if (e1 || !pending) {
      return res.status(404).json({ ok: false, error: "Pedido pendente não encontrado" });
    }

    if (pending.status !== "PENDING") {
      return res.status(409).json({ ok: false, error: `Pedido já está em ${pending.status}` });
    }

    const { error: e2 } = await supabaseAdmin
      .from("pending_orders")
      .update({
        status: "REJECTED",
        rejected_at: new Date().toISOString(),
        rejected_by: rejectedBy,
        reject_reason: reason,
      })
      .eq("id", id);

    if (e2) {
      return res.status(502).json({ ok: false, error: "Erro ao atualizar Supabase", details: e2.message });
    }

    return res.json({ ok: true });
  })
);

/**
 * GET /orders/:id -> detalhe (Vendus)
 */
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

/**
 * POST /orders -> AGORA: guarda no Supabase como PENDING (não cria no Vendus)
 */
ordersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    if (!req.is("application/json")) {
      return res.status(415).json({ ok: false, error: "Content-Type must be application/json" });
    }

    const input = req.body;

    // validações mínimas
    if (!input?.register_id) {
      return res.status(400).json({ ok: false, error: "Campo 'register_id' é obrigatório." });
    }

    const clientId = input.client_id ?? input.client?.id;
    if (!clientId) {
      return res.status(400).json({ ok: false, error: "Campo 'client_id' é obrigatório." });
    }

    if (!Array.isArray(input.items) || input.items.length === 0) {
      return res.status(400).json({ ok: false, error: "O campo 'items' é obrigatório e deve ser uma lista." });
    }

    const { data, error } = await supabaseAdmin
      .from("pending_orders")
      .insert([
        {
          status: "PENDING",
          payload: input,
          client_name: input?.client?.name ?? null,
          client_email: input?.client?.email ?? null,
        },
      ])
      .select("id, status, created_at")
      .single();

    if (error) {
      return res.status(502).json({ ok: false, error: "Erro Supabase", details: error.message });
    }

    return res.json({
      ok: true,
      pendingOrder: data,
      message: "Pedido registado como PENDENTE. Aguarda aceitação do funcionário.",
    });
  })
);
