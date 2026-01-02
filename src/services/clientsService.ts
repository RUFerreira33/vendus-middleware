// src/services/clientsService.ts
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
    const nome = (input.nome ?? "").trim();
    const email = (input.email ?? "").trim();
    const telefone = (input.telefone ?? "").trim();
    const nif = (input.nif ?? "").trim();

    if (!nome) {
      throw new ApiError(400, "Campo 'nome' é obrigatório.");
    }
    if (!telefone && !nif) {
      throw new ApiError(400, "Campo 'telefone' ou 'nif' é obrigatório.");
    }

    // Procurar candidato por fiscal_id (melhor) ou por pesquisa
    let candidates: VendusClientType[] = [];
    if (nif) {
      candidates = await this.vendus.get<VendusClientType[]>(
        `/clients/?fiscal_id=${encodeURIComponent(nif)}`
      );
    } else if (telefone) {
      candidates = await this.vendus.get<VendusClientType[]>(
        `/clients/?q=${encodeURIComponent(telefone)}`
      );
    }

    const existing = (candidates || []).find(c =>
      (telefone && c.phone === telefone) || (nif && c.fiscal_id === nif)
    );

    if (existing) {
      return { clientId: existing.id, created: false };
    }

    // IMPORTANTE: não enviar strings vazias para a Vendus — omitir campos não presentes
    const payload: Record<string, string> = { name: nome };

    if (nif) payload.fiscal_id = nif;
    if (telefone) payload.phone = telefone;
    if (email) payload.email = email;

    const created = await this.vendus.post<VendusClientType>(`/clients/`, payload);

    if (!created?.id) {
      throw new ApiError(502, "Resposta inválida da Vendus ao criar cliente", created);
    }

    return { clientId: created.id, created: true };
  }
}
