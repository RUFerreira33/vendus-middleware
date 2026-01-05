import { VendusClient } from "./vendusClient.js";
import { ApiError } from "../errors.js";

type VendusDocListItem = {
  id: number;
  number?: string;
  date?: string;
  type?: string;
  subtype?: string;
  status?: string;
  amount_gross?: number | string;
  amount_net?: number | string;
  store_id?: number;
  register_id?: number;
  external_reference?: string;
  client_id?: number; 
};

type CreateOrderInput = {
  register_id: number;

  // associação direta ao cliente
  client_id?: number;

  items: Array<{
    qty: number;
    id?: number;
    reference?: string;
    price?: number;
    discount?: number;
    tax_id?: number;
    notes?: string;
  }>;

  // opcionais (pass-through)
  date?: string;
  date_due?: string;
  date_supply?: string;
  notes?: string;
  external_reference?: string;
  mode?: "normal" | "tests";
  stock_operation?: "out" | "none";

  // opcional: se vier client.id, também aceitamos
  client?: {
    id?: number;
    fiscal_id?: string;
    name?: string;
    address?: string;
    postalcode?: string;
    city?: string;
    phone?: string;
    mobile?: string;
    email?: string;
    country?: string; // ex: "PT"
    send_email?: "yes" | "no";
  };
};

export class OrdersService {
  constructor(private vendus = new VendusClient()) {}

  async list(queryString: string) {
    // Orders = Documents type EC (Encomenda)
    const rows = await this.vendus.get<VendusDocListItem[]>(`/documents/${queryString}`);
    const arr = Array.isArray(rows) ? rows : [];

    return arr.map((d) => ({
      id: d.id,
      number: d.number ?? "",
      date: d.date ?? "",
      type: d.type ?? "",
      subtype: d.subtype ?? "",
      status: d.status ?? "",
      amount_gross: d.amount_gross ?? null,
      amount_net: d.amount_net ?? null,
      store_id: d.store_id ?? null,
      register_id: d.register_id ?? null,
      external_reference: d.external_reference ?? "",
      client_id: d.client_id ?? null, 
    }));
  }

  async getById(id: string, queryString = "") {
    if (!id) throw new ApiError(400, "Missing id");
    const qs = queryString
      ? queryString.startsWith("?")
        ? queryString
        : `?${queryString}`
      : "";
    return this.vendus.get<any>(`/documents/${encodeURIComponent(id)}/${qs}`);
  }

  async create(input: CreateOrderInput) {
    if (!input?.register_id) throw new ApiError(400, "Campo 'register_id' é obrigatório.");
    if (!Array.isArray(input?.items) || input.items.length === 0) {
      throw new ApiError(400, "Campo 'items' é obrigatório e tem de ter pelo menos 1 linha.");
    }

    for (const [i, it] of input.items.entries()) {
      if (!it || typeof it.qty !== "number" || it.qty <= 0) {
        throw new ApiError(400, `items[${i}].qty inválido.`);
      }
      if (!it.id && !it.reference) {
        throw new ApiError(400, `items[${i}] tem de ter 'id' ou 'reference'.`);
      }
    }

    // associação ao cliente
    const clientId = input.client_id ?? input.client?.id;
    if (!clientId) {
      throw new ApiError(400, "Campo 'client_id' é obrigatório (ou 'client.id').");
    }

    // payload Vendus: Document type EC
    const payload: any = {
      type: "EC",
      register_id: input.register_id,
      client_id: clientId,
      items: input.items.map((it) => {
        const row: any = { qty: it.qty };
        if (typeof it.id === "number") row.id = it.id;
        if (it.reference) row.reference = it.reference;
        if (typeof it.price === "number") row.price = it.price;
        if (typeof it.discount === "number") row.discount = it.discount;
        if (typeof it.tax_id === "number") row.tax_id = it.tax_id;
        if (it.notes) row.notes = it.notes;
        return row;
      }),
    };

    if (input.date) payload.date = input.date;
    if (input.date_due) payload.date_due = input.date_due;
    if (input.date_supply) payload.date_supply = input.date_supply;
    if (input.notes) payload.notes = input.notes;
    if (input.external_reference) payload.external_reference = input.external_reference;
    if (input.mode) payload.mode = input.mode;
    if (input.stock_operation) payload.stock_operation = input.stock_operation;

    const created = await this.vendus.post<any>(`/documents/`, payload);
    if (!created) throw new ApiError(502, "Resposta inválida do Vendus ao criar encomenda.");

    return created;
  }
}
