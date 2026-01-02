import { VendusClient } from "./vendusClient.js";
import { ApiError } from "../errors.js";

type VendusClientType = {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  fiscal_id?: string;
};

export class ClientsService {
  constructor(private vendus = new VendusClient()) {}

  async list(queryString: string) {
    // Vendus Clients list é GET /clients/ :contentReference[oaicite:6]{index=6}
    const rows = await this.vendus.get<VendusClientType[]>(`/clients/${queryString}`);
    const arr = Array.isArray(rows) ? rows : [];
    return arr.map(c => ({
      id: c.id,
      name: c.name ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      fiscal_id: c.fiscal_id ?? ""
    }));
  }

  async getById(id: string) {
    if (!id) throw new ApiError(400, "Missing id");
    const c = await this.vendus.get<VendusClientType>(`/clients/${encodeURIComponent(id)}/`);
    return {
      id: c.id,
      name: c.name ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      fiscal_id: c.fiscal_id ?? ""
    };
  }

  async createIfNotExists(input: { nome: string; email?: string; telefone?: string; nif?: string }) {
    const { nome, email, telefone, nif } = input;

    if (!nome || (!telefone && !nif)) {
      throw new ApiError(400, "Nome e (telefone ou nif) são obrigatórios.");
    }

    // Melhor do que listar “à bruta”: usar filtros da Vendus quando possível :contentReference[oaicite:7]{index=7}
    let candidates: VendusClientType[] = [];
    if (nif) {
      candidates = await this.vendus.get<VendusClientType[]>(`/clients/?fiscal_id=${encodeURIComponent(nif)}`);
    } else if (telefone) {
      candidates = await this.vendus.get<VendusClientType[]>(`/clients/?q=${encodeURIComponent(telefone)}`);
    }

    const existing = (candidates || []).find(c =>
      (telefone && c.phone === telefone) || (nif && c.fiscal_id === nif)
    );

    if (existing) return { clientId: existing.id, created: false };

    // Create POST /clients/ :contentReference[oaicite:8]{index=8}
    const created = await this.vendus.post<VendusClientType>(`/clients/`, {
      fiscal_id: nif || "",
      name: nome,
      phone: telefone || "",
      email: email || ""
    });

    if (!created?.id) {
      throw new ApiError(502, "Resposta inválida da Vendus ao criar cliente", created);
    }

    return { clientId: created.id, created: true };
  }
}
