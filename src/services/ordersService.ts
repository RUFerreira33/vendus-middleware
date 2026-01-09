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
  constructor(public vendus = new VendusClient()) {}

  async list(queryString: string) {
    console.log("Listando documentos com query:", queryString);
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
    const qs = queryString ? (queryString.startsWith("?") ? queryString : `?${queryString}`) : "";
    return this.vendus.get<any>(`/documents/${encodeURIComponent(id)}${qs}`);
  }

  async create(input: CreateOrderInput) {
    try {
      console.log("--- NOVO PEDIDO RECEBIDO DO UIPATH ---");
      console.log("Payload de entrada:", JSON.stringify(input, null, 2));

      if (!input?.register_id) throw new ApiError(400, "Campo 'register_id' é obrigatório.");
      
      const clientId = input.client_id ?? input.client?.id;
      if (!clientId) throw new ApiError(400, "Campo 'client_id' é obrigatório.");

      if (!input.items || !Array.isArray(input.items)) {
        throw new ApiError(400, "O campo 'items' é obrigatório e deve ser uma lista.");
      }

      const payload: any = {
        type: "EC", 
        register_id: input.register_id,
        client: { id: clientId },
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

      console.log("Enviando para Vendus API:", JSON.stringify(payload, null, 2));

      const created = await this.vendus.post<any>(`/documents`, payload);
      
      if (!created) {
        console.error("Vendus API não devolveu resposta válida.");
        throw new ApiError(502, "Erro ao criar encomenda no Vendus.");
      }

      console.log("Sucesso! Documento criado com ID:", created.id);
      return created;

    } catch (error: any) {
      console.error("### ERRO INTERNO NO ORDERS SERVICE ###");
      console.error("Mensagem:", error.message);
      if (error.response) {
        console.error("Detalhes da API Vendus:", JSON.stringify(error.response.data, null, 2));
      }
      throw error; 
    }
  }
}