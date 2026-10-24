import type { Product, Variant } from "../data/products";

// Sizes and their prices. Products saved in the admin store their own variant prices; the
// built-in starter catalog derives them from the base price with the rules below, so the
// shop page and the server-side checkout always agree on what a size costs.

function legacyPrice(p: Pick<Product, "id" | "handle" | "price">, weight: string) {
  const is = (slug: string) => p.id === slug || p.handle === slug;
  if (is("organic-green")) {
    if (weight === "100G") return 232;
    if (weight === "200G") return 454;
    if (weight === "300G") return 667;
  }
  if (is("kesar-rose-chai")) {
    if (weight === "250G") return 458;
    if (weight === "500G") return 916;
    if (weight === "750G") return 1373;
    if (weight === "1 KG" || weight === "1KG") return 1831;
  }
  if (is("ojas-ras-chai")) {
    if (weight === "100G") return 349;
    if (weight === "150G") return 499;
    if (weight === "250G") return 799;
  }
  if (weight === "100G") return Math.round(p.price * 0.55);
  if (weight === "150G") return p.price;
  if (weight === "200G") return Math.round(p.price * 1.0);
  if (weight === "250G") return p.price;
  if (weight === "300G") return Math.round(p.price * 1.45);
  if (weight === "500G") return Math.round(p.price * 1.85);
  if (weight === "750G") return Math.round(p.price * 2.7);
  if (weight === "1KG" || weight === "1 KG") return Math.round(p.price * 3.4);
  if (weight === "50 Teabags") return Math.round(p.price * 1.8);
  if (weight === "2 Boxes") return Math.round(p.price * 1.9);
  return p.price;
}

function legacyCompareAt(p: Pick<Product, "id" | "handle" | "price" | "originalPrice">, weight: string) {
  const is = (slug: string) => p.id === slug || p.handle === slug;
  if (is("organic-green")) {
    if (weight === "100G") return 290;
    if (weight === "200G") return 464;
    if (weight === "300G") return 696;
  }
  if (is("kesar-rose-chai")) {
    if (weight === "250G") return 654;
    if (weight === "500G") return 1308;
    if (weight === "750G") return 1962;
    if (weight === "1 KG" || weight === "1KG") return 2616;
  }
  if (is("ojas-ras-chai")) {
    if (weight === "100G") return 420;
    if (weight === "150G") return 599;
    if (weight === "250G") return 960;
  }
  const ratio = p.originalPrice > p.price ? p.originalPrice / p.price : 1.25;
  return Math.round(legacyPrice(p, weight) * ratio);
}

/** The product's sizes with prices: stored variants, or derived ones for the starter catalog. */
export function productVariants(
  p: Pick<Product, "id" | "handle" | "price" | "originalPrice" | "weight" | "weights" | "variants">
): Variant[] {
  if (p.variants && p.variants.length > 0) return p.variants;
  const names = p.weights && p.weights.length > 0 ? p.weights : [p.weight || "Default"];
  return names.map((name) => ({
    name,
    price: legacyPrice(p, name),
    compareAtPrice: legacyCompareAt(p, name),
  }));
}

/** The size the customer picked, or the first size when it no longer exists. */
export function findVariant(
  p: Pick<Product, "id" | "handle" | "price" | "originalPrice" | "weight" | "weights" | "variants">,
  name: string | null | undefined
): Variant {
  const variants = productVariants(p);
  return variants.find((v) => v.name === name) || variants[0];
}
