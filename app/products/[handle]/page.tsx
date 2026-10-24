import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProductDetailLayoutWrapper from "@/components/ProductDetailLayoutWrapper";
import { getStoreProduct, getStoreProducts } from "@/lib/catalog";

interface PageProps {
  params: Promise<{ handle: string }>;
}

// Products added later in the admin are rendered on their first visit.
export async function generateStaticParams() {
  return (await getStoreProducts()).map((p) => ({
    handle: p.handle || p.id,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const product = await getStoreProduct(handle);

  if (!product) {
    return {
      title: "Product Not Found - Teabox",
    };
  }

  return {
    title: `${product.title} | Fresh Indian Tea - Teabox`,
    description: `Buy ${product.title} online at Teabox. ${product.subtitle}. 100% fresh, garden-direct tea delivered to your door.`,
    openGraph: {
      title: product.title,
      description: product.subtitle,
      images: [
        {
          url: product.image,
          width: 800,
          height: 800,
          alt: product.title,
        },
      ],
    },
  };
}

async function ProductContent({ params }: PageProps) {
  const { handle } = await params;
  const products = await getStoreProducts();
  const product = products.find((p) => p.handle === handle || p.id === handle);

  if (!product) {
    notFound();
  }

  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  return <ProductDetailLayoutWrapper product={product} related={related} />;
}

export default function ProductPage(props: PageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ProductContent {...props} />
    </Suspense>
  );
}
