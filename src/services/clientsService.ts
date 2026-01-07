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

function isValidPTNif(nif: string) {
  const s = (nif || "").replace(/\D/g, "");
  if (!/^\d{9}$/.test(s)) return false;

  const digits = s.split("").map(Number);
  let sum = 0;
  for (let i = 0; i < 8; i++) sum += digits[i] * (9 - i);
  const check = 11 - (sum % 11);
  const checkDigit = check >= 10 ? 0 : check;

  return checkDigit === digits[8];
}

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

    if (!nome) throw new ApiError(400, "Campo 'nome' é obrigatório.");
    if (!telefone && !nif) throw new ApiError(400, "Campo 'telefone' ou 'nif' é obrigatório.");

    // procurar existente por fiscal_id (melhor) ou por pesquisa
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

    if (existing) return { clientId: existing.id, created: false };

    // ✅ payload sem campos vazios + defaults úteis (mais compatível com a UI)
    const payload: Record<string, string> & {
      country?: string;
      send_email?: "yes" | "no";
      irs_retention?: "yes" | "no";
      default_pay_due?: "now" | "30" | "60" | "90";
    } = {
      name: nome,
      country: "PT",
      send_email: "no",
      irs_retention: "no",
      default_pay_due: "now"
    };

    if (email) payload.email = email;
    if (telefone) payload.phone = telefone;

    // só manda fiscal_id se for NIF PT válido (evita rejeições)
    if (nif && isValidPTNif(nif)) payload.fiscal_id = nif;

    const created = await this.vendus.post<VendusClientType>(`/clients`, payload);

    if (!created?.id) {
      throw new ApiError(502, "Resposta inválida da Vendus ao criar cliente", created);
    }

    return { clientId: created.id, created: true };
  }
}
