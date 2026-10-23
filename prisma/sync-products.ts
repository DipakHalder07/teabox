// Adds catalog products (data/products.ts) that are missing from the database. Existing rows,
// including prices and stock edited in the admin, are left untouched. Run on every Vercel deploy.
import { PrismaClient } from "@prisma/client";
import { PRODUCTS } from "../data/products";
import { productRow } from "./productRow";

const prisma = new PrismaClient();

async function main() {
  const { count } = await prisma.product.createMany({ data: PRODUCTS.map(productRow), skipDuplicates: true });
  console.log(`📦 Products: ${count} added, ${PRODUCTS.length - count} already in the database.`);
}

main()
  .catch((e) => {
    console.error("❌ Product sync failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
