// src/services/paymentsService.ts
/*import { VendusClient } from "./vendusClient.js"; 
import { ApiError } from "../errors.js";

type PayInvoiceInput = {
  invoiceId: string;
  amount?: number;           
  method?: "cash" | "card" | "transfer" | "mbway" | string;
  date?: string;
  notes?: string;
};

export class PaymentsService {
  private vendus: VendusClient;

  constructor() {
    this.vendus = new VendusClient();
  }

  private today() {
    return new Date().toISOString().slice(0, 10);
  }

  /**
   * Estratégia A (normal no Vendus): pagar uma fatura criando um recibo (RC)
   * que referencia a fatura (invoiceId).
   */
 /* async payInvoiceByReceipt(input: PayInvoiceInput) {
    const invoiceId = String(input.invoiceId || "").trim();
    if (!invoiceId) throw new ApiError(400, "invoiceId é obrigatório");

    const method = input.method || "cash";
    const date = input.date || this.today();
    const notes = input.notes || "";

    // 1) Buscar a fatura para saber o total/balance
    const invoice = await this.vendus.get<any>(`/documents/${encodeURIComponent(invoiceId)}`);

    const total =
      Number(invoice?.total) ||
      Number(invoice?.amount) ||
      Number(invoice?.total_gross) ||
      Number(invoice?.total_with_taxes) ||
      0;

    // alguns modelos têm "balance", "due", etc.
    const balance =
      Number(invoice?.balance) ||
      Number(invoice?.balance_due) ||
      Number(invoice?.amount_due) ||
      0;

    const amount = Number.isFinite(input.amount as number)
      ? Number(input.amount)
      : (balance > 0 ? balance : total);

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ApiError(400, "amount inválido (<=0). Não foi possível determinar total/balance da fatura.");
    }

    // 2) Criar Recibo (RC) que liquida a fatura
    // O payload exato pode variar; este é o formato mais típico:
    const payload = {
      type: "RC",                 // Recibo
      date,
      notes,
      payments: [
        {
          method,                 // cash/card/transfer...
          amount
        }
      ],
      // ligações à fatura:
      settled_documents: [
        {
          id: invoiceId,
          amount
        }
      ]
    };

    // normalmente é POST /documents
    return this.vendus.post<any>("/documents", payload);
  }

  /**
   * Estratégia B: se a vossa API suportar pagamentos diretamente:
   * POST /documents/{id}/payments
   */
  /*async payInvoiceByPaymentsEndpoint(input: PayInvoiceInput) {
    const invoiceId = String(input.invoiceId || "").trim();
    if (!invoiceId) throw new ApiError(400, "invoiceId é obrigatório");

    const method = input.method || "cash";
    const date = input.date || this.today();
    const notes = input.notes || "";

    // tenta obter total para preencher amount se não vier
    let amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      const invoice = await this.vendus.get<any>(`/documents/${encodeURIComponent(invoiceId)}`);
      const total =
        Number(invoice?.total) ||
        Number(invoice?.amount) ||
        Number(invoice?.total_gross) ||
        0;

      amount = total;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ApiError(400, "amount inválido (<=0).");
    }

    const payload = { method, amount, date, notes };

    return this.vendus.post<any>(`/documents/${encodeURIComponent(invoiceId)}/payments`, payload);
  }
}
*/