import type { Product } from "../types";

// Fallback local au cas ou l'API catalogue serait indisponible (lecture du JSON statique).
export async function loadLocalProducts(): Promise<Product[]> {
  const res = await fetch("/products.json");
  if (!res.ok) {
    throw new Error("Failed to load local products");
  }
  return res.json();
}
