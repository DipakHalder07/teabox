import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PRODUCTS } from "../data/products";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Teabox PostgreSQL Database...");

  // 1. Create Default Admin (only with a password from the environment, never a built-in one)
  const adminEmail = (process.env.ADMIN_DEFAULT_EMAIL || "admin@teabox.com").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD;
  if (!adminPassword) {
    console.log("⚠️  ADMIN_DEFAULT_PASSWORD is not set: skipping the admin user.");
  } else {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const admin = await prisma.admin.upsert({
      where: { email: adminEmail },
      update: {
        passwordHash,
        role: "SUPER_ADMIN",
        isActive: true,
        sessionVersion: { increment: 1 },
      },
      create: {
        email: adminEmail,
        passwordHash,
        name: "Teabox Admin",
        role: "SUPER_ADMIN",
        isActive: true,
      },
    });
    console.log(`✅ Admin user seeded: ${admin.email} (Role: ${admin.role})`);
  }

  // 2. Seed All Products from data/products.ts
  console.log(`📦 Seeding ${PRODUCTS.length} tea products...`);
  let seededProducts = 0;

  for (const prod of PRODUCTS) {
    await prisma.product.upsert({
      where: { id: prod.id },
      update: {
        title: prod.title,
        subtitle: prod.subtitle,
        description: prod.subtitle,
        price: prod.price,
        originalPrice: prod.originalPrice,
        rating: prod.rating || 4.9,
        reviewsCount: prod.reviewsCount || 0,
        badge: prod.badge,
        image: prod.image,
        secondaryImage: prod.secondaryImage,
        galleryImages: prod.galleryImages || [prod.image],
        weights: prod.weights || ["100G", "200G", "300G"],
        inStock: prod.inStock ?? true,
        category: prod.category,
        estate: prod.region,
        caffeine: prod.caffeine,
      },
      create: {
        id: prod.id,
        handle: prod.handle || prod.id,
        title: prod.title,
        subtitle: prod.subtitle,
        description: prod.subtitle,
        price: prod.price,
        originalPrice: prod.originalPrice,
        rating: prod.rating || 4.9,
        reviewsCount: prod.reviewsCount || 0,
        badge: prod.badge,
        image: prod.image,
        secondaryImage: prod.secondaryImage,
        galleryImages: prod.galleryImages || [prod.image],
        weights: prod.weights || ["100G", "200G", "300G"],
        inStock: prod.inStock ?? true,
        category: prod.category,
        estate: prod.region,
        caffeine: prod.caffeine,
      },
    });
    seededProducts++;
  }

  console.log(`✅ Seeded ${seededProducts} products into PostgreSQL.`);
  console.log("✨ Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
