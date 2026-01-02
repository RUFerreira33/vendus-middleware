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

  private authHeaderBasic() {
    // Docs: Basic Auth com api_key como user (password vazia) :contentReference[oaicite:1]{index=1}
    const token = Buffer.from(`${this.apiKey}:`, "utf8").toString("base64");
    return `Basic ${token}`;
  }

  private headers(extra?: Record<string, string>) {
    return {
      "Authorization": this.authHeaderBasic(),
      "Accept": "application/json",
      ...(extra || {})
    };
  }

  private async handle<T>(res: Response): Promise<T> {
    const text = await res.text();
    const j = text ? safeJson(text) : null;

    if (!res.ok) {
      throw new ApiError(res.status, "Vendus API error", j ?? text);
    }

    // A Vendus pode devolver objeto direto ou envelope; aqui devolvemos o JSON como vem
    return (j as T);
  }

  async get<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      method: "GET",
      headers: this.headers({ "Content-Type": "application/json" })
    });
    return this.handle<T>(res);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    const content = JSON.stringify(body ?? {});
    if (content === "{}") {
      // evita mandar vazio sem querer
      throw new ApiError(400, "Empty body when calling Vendus");
    }

    const res = await fetch(url, {
      method: "POST",
      headers: this.headers({
        "Content-Type": "application/json",
        // alguns servidores (incl. Vendus) comportam-se melhor com Content-Length explícito :contentReference[oaicite:2]{index=2}
        "Content-Length": String(Buffer.byteLength(content, "utf8"))
      }),
      body: content
    });

    return this.handle<T>(res);
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const content = JSON.stringify(body ?? {});

    const res = await fetch(url, {
      method: "PATCH",
      headers: this.headers({
        "Content-Type": "application/json",
        "Content-Length": String(Buffer.byteLength(content, "utf8"))
      }),
      body: content
    });

    return this.handle<T>(res);
  }
}
