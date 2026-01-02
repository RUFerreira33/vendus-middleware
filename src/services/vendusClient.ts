import { getConfig } from "../config.js";
import { ApiError } from "../errors.js";

function safeJson(text: string) {
  try { return JSON.parse(text); } catch { return null; }
}

export class VendusClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    const cfg = getConfig();
    this.baseUrl = cfg.VENDUS_BASE_URL;
    this.apiKey = cfg.VENDUS_API_KEY;
  }

  private headers() {
    // Vendus suporta Bearer Auth com API key :contentReference[oaicite:3]{index=3}
    return {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json"
    };
  }

  private async handle<T>(res: Response): Promise<T> {
    const text = await res.text();
    const j = text ? safeJson(text) : null;

    if (!res.ok) {
      throw new ApiError(res.status, "Vendus API error", j ?? text);
    }

    // Vendus tipicamente envelope em { data: ... } :contentReference[oaicite:4]{index=4}
    if (j && typeof j === "object" && "data" in (j as any)) {
      return (j as any).data as T;
    }

    return j as T;
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, { method: "GET", headers: this.headers() });
    return this.handle<T>(res);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(body)
    });
    return this.handle<T>(res);
  }
}
