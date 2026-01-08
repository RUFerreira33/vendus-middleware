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
  client?: { 
    id?: number;
    name?: string;  
    email?: string; 
  };
};

type CreateOrderInput = {
  register_id: number;
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
  date?: string;
  date_due?: string;
  date_supply?: string;
  notes?: string;
  external_reference?: string;
  mode?: "normal" | "tests";
  stock_operation?: "out" | "none";
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
    country?: string;
    send_email?: "yes" | "no";
  };
};

export class OrdersService {
  constructor(private vendus = new VendusClient()) {}

  async list(queryString: string) {
    const query = queryString
      ? (queryString.startsWith("?") ? queryString : `?${queryString}`)
      : "";

    const rows = await this.vendus.get<VendusDocListItem[]>(`/documents${query}`);
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
      client_id: d.client_id ?? d.client?.id ?? null,
      client_name: d.client?.name ?? "Consumidor Final",
      client_email: d.client?.email ?? ""
    }));
  }

  async getById(id: string, queryString = "") {
    if (!id) throw new ApiError(400, "Missing id");
    
    const qs = queryString
      ? (queryString.startsWith("?") ? queryString : `?${queryString}`)
      : "";
    
    return this.vendus.get<any>(`/documents/${encodeURIComponent(id)}${qs}`);
  }

  async create(input: CreateOrderInput) {
    if (!input?.register_id) throw new ApiError(400, "Campo 'register_id' é obrigatório.");
    if (!Array.isArray(input?.items) || input.items.length === 0) {
      throw new ApiError(400, "Campo 'items' é obrigatório.");
    }

    const clientId = input.client_id ?? input.client?.id;
    if (!clientId) throw new ApiError(400, "Campo 'client_id' é obrigatório.");

    const payload: any = {
      type: "EC",
      register_id: input.register_id,
      client_id: clientId,
      items: input.items.map((it: any) => ({
        qty: it.qty,
        id: it.id,
        reference: it.reference,
        price: it.price,
        discount: it.discount,
        tax_id: it.tax_id,
        notes: it.notes
      })),
    };

    if (input.date) payload.date = input.date;
    if (input.mode) payload.mode = input.mode;

    const created = await this.vendus.post<any>(`/documents`, payload);
    if (!created) throw new ApiError(502, "Erro ao criar encomenda no Vendus.");

    return created;
  }
}