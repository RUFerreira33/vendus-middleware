// src/routes/payments.ts
import { Router } from "express";
import { PaymentsService } from "../services/paymentsService";

export const paymentsRouter = Router();
const service = new PaymentsService();

/**
 * POST /payments/invoices/:invoiceId/pay
 * body: { amount?, method?, date?, notes?, strategy? }
 *
 * strategy:
 *  - "receipt" (default) -> cria recibo (RC)
 *  - "endpoint"          -> chama /documents/:id/payments
 */
paymentsRouter.post("/invoices/:invoiceId/pay", async (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    const { amount, method, date, notes, strategy } = req.body || {};

    const input = {
      invoiceId,
      amount: amount !== undefined ? Number(amount) : undefined,
      method,
      date,
      notes
    };

    const result =
      strategy === "endpoint"
        ? await service.payInvoiceByPaymentsEndpoint(input)
        : await service.payInvoiceByReceipt(input);

    return res.json({ ok: true, result });
  } catch (err) {
    next(err);
  }
});
