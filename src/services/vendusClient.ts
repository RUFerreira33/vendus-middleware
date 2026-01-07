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
    this.baseUrl = cfg.VENDUS_BASE_URL.replace(/\/+$/, "");
    this.apiKey = cfg.VENDUS_API_KEY;
  }

  private basicAuthHeader() {
    // Basic Auth: api_key como user, password vazia :contentReference[oaicite:3]{index=3}
    const token = Buffer.from(`${this.apiKey}:`, "utf8").toString("base64");
    return `Basic ${token}`;
  }

  private async handle<T>(res: Response): Promise<T> {
    const text = await res.text();
    const j = text ? safeJson(text) : null;

    if (!res.ok) {
      throw new ApiError(res.status, "Vendus API error", j ?? text);
    }

    return j as T;
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "GET",
      headers: {
        "Authorization": this.basicAuthHeader(),
        "Accept": "application/json"
      }
    });
    return this.handle<T>(res);
  }

 async post<T>(path: string, body: Record<string, string>): Promise<T> {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  }

  const res = await fetch(`${this.baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Authorization": this.basicAuthHeader(),
      "Accept": "application/json",
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });

  return this.handle<T>(res);
}

}
