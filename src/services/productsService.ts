import { VendusClient } from "./vendusClient.js";
import { ApiError } from "../errors.js";

type VendusProduct = {
  id: number;
  reference?: string;
  title?: string;
  gross_price?: number | string;
  supply_price?: number | string;
  price_without_tax?: number | string;
  stock?: number | string;

  image_url?: string;
  image?: string;
  photo_url?: string;
  photo?: string;
};

function pickImageUrl(p: VendusProduct): string {
  return (
    p.image_url ||
    p.photo_url ||
    p.image ||
    p.photo ||
    ""
  );
}

export class ProductsService {
  constructor(private vendus = new VendusClient()) {}

  async list(queryString: string) {
    // Vendus Products list é GET /products/
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

    const p = await this.vendus.get<VendusProduct>(`/products/${encodeURIComponent(id)}/`);

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
