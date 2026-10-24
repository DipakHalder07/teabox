// Copies the starter catalog (data/products.ts) into the database once, on the first deploy.
// After that the admin owns the catalog: edited prices and stock are kept, and products deleted
// in the admin are not brought back. Run on every Vercel deploy.
import { PrismaClient } from "@prisma/client";
import { PRODUCTS } from "../data/products";
import { productRow } from "./productRow";

const prisma = new PrismaClient();
const SEEDED_KEY = "catalog.seeded"; // same flag as lib/catalog.ts

async function main() {
  if (await prisma.gatewaySetting.findUnique({ where: { key: SEEDED_KEY } })) {
    console.log("📦 Products: catalog is managed in the admin, nothing to sync.");
    return;
  }
  const { count } = await prisma.product.createMany({ data: PRODUCTS.map(productRow), skipDuplicates: true });
  await prisma.gatewaySetting.create({ data: { key: SEEDED_KEY, value: new Date().toISOString() } });
  console.log(`📦 Products: ${count} added from the starter catalog.`);
}

main()
  .catch((e) => {
    console.error("❌ Product sync failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
