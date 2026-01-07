import { getConfig } from "../config.js";
import { ApiError } from "../errors.js";
//import fetch from "node-fetch";


function safeJson(text: string) {
  try { return JSON.parse(text); } catch { return null; }
}

type VendusErrorShape = {
  errors?: Array<{ code?: string; message?: string }>;
};

export class VendusClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    const cfg = getConfig();
    this.baseUrl = cfg.VENDUS_BASE_URL.replace(/\/+$/, "");
    this.apiKey = cfg.VENDUS_API_KEY;
  }

  private basicAuthHeader() {
    const token = Buffer.from(`${this.apiKey}:`, "utf8").toString("base64");
    return `Basic ${token}`;
  }

  private normalizePath(path: string) {
    if (!path.startsWith("/")) return `/${path}`;
    return path;
  }

  private async handle<T>(res: Response, info?: { method: string; url: string }): Promise<T> {
    const text = await res.text();
    const j = text ? safeJson(text) : null;

    if (!res.ok) {
      const vendusMsg =
        (j as VendusErrorShape | null)?.errors?.[0]?.message ||
        res.statusText ||
        "Vendus API error";

      throw new ApiError(
        res.status,
        `Vendus API error: ${vendusMsg}`,
        { url: info?.url, method: info?.method, response: j ?? text }
      );
    }

    // se vier vazio, devolve null (evita crash)
    return (j as T) ?? (null as T);
  }

  async get<T>(path: string): Promise<T> {
    const p = this.normalizePath(path);
    const url = `${this.baseUrl}${p}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": this.basicAuthHeader(),
        "Accept": "application/json"
      }
    });

    return this.handle<T>(res, { method: "GET", url });
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const p = this.normalizePath(path);
    const url = `${this.baseUrl}${p}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": this.basicAuthHeader(),
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body ?? {})
    });

    return this.handle<T>(res, { method: "POST", url });
  }
}
