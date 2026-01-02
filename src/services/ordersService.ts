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
};

type CreateOrderInput = {
  register_id: number;
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

    return arr.map(d => ({
      id: d.id,
      number: d.number ?? "",
      date: d.date ?? "",
      type: d.type ?? "",
      status: d.status ?? "",
      amount_gross: d.amount_gross ?? null,
      amount_net: d.amount_net ?? null,
      store_id: d.store_id ?? null,
      register_id: d.register_id ?? null,
      external_reference: d.external_reference ?? ""
    }));
  }

  async getById(id: string, queryString = "") {
    if (!id) throw new ApiError(400, "Missing id");
    const qs = queryString ? (queryString.startsWith("?") ? queryString : `?${queryString}`) : "";
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

    // type EC = Encomenda :contentReference[oaicite:4]{index=4}
    c
