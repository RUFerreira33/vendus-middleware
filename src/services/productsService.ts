import { VendusClient } from "./vendusClient.js";
import { ApiError } from "../errors.js";

type VendusImages = {
  xs?: string;
  m?: string; 
};

type VendusVariant = {
  images?: VendusImages;
};

type VendusProduct = {
  id: number;
  reference?: string;
  title?: string;
  gross_price?: number | string;
  supply_price?: number | string;
  price_without_tax?: number | string;
  stock?: number | string;

  images?: VendusImages;

  variants?: VendusVariant[];

  image_url?: string;
  image?: string;
  photo_url?: string;
  photo?: string;
};

function toFullVendusUrl(path?: string): string {
  if (!path) return "";
  const s = String(path).trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) return `https://www.vendus.pt${s}`;
  return `https://www.vendus.pt/${s}`;
}

function pickImageUrl(p: VendusProduct): string {
  const direct = p?.images?.m || p?.images?.xs;
  if (direct) return toFullVendusUrl(direct);

  const v0 = p?.variants?.[0];
  const viaVariant = v0?.images?.m || v0?.images?.xs;
  if (viaVariant) return toFullVendusUrl(viaVariant);

  const legacy =
    p.image_url ||
    p.photo_url ||
    p.image ||
    p.photo ||
    "";

  return toFullVendusUrl(legacy);
}

export class ProductsService {
  constructor(private vendus = new VendusClient()) {}

  async list(queryString: string) {
    const rows = await this.vendus.get<VendusProduct[]>(`/products/${queryString}`);
    const arr = Array.isArray(rows) ? rows : [];

    return arr.map(p => ({
      id: p.id,
      reference: p.reference ?? "",
      title: p.title ?? "",
      gross_price: p.gross_price ?? null,
      supply_price: p.supply_price ?? null,
      price_without_tax: p.price_without_tax ?? null,
      stock: p.stock ?? null,
      imageUrl: pickImageUrl(p)
    }));
  }

  async getById(id: string) {
    if (!id) throw new ApiError(400, "Missing id");

    const p = await this.vendus.get<VendusProduct>(
      `/products/${encodeURIComponent(id)}/`
    );

    return {
      id: p.id,
      reference: p.reference ?? "",
      title: p.title ?? "",
      gross_price: p.gross_price ?? null,
      supply_price: p.supply_price ?? null,
      price_without_tax: p.price_without_tax ?? null,
      stock: p.stock ?? null,
      imageUrl: pickImageUrl(p)
    };
  }
}
