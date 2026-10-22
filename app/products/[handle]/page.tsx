import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProductDetailLayoutWrapper from "@/components/ProductDetailLayoutWrapper";
import { PRODUCTS } from "@/data/products";

interface PageProps {
  params: Promise<{ handle: string }>;
}

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({
    handle: p.handle || p.id,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params;
  const product = PRODUCTS.find((p) => p.handle === handle || p.id === handle);

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
  const product = PRODUCTS.find((p) => p.handle === handle || p.id === handle);

  if (!product) {
    notFound();
  }

  return <ProductDetailLayoutWrapper product={product} />;
}

export default function ProductPage(props: PageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ProductContent {...props} />
    </Suspense>
  );
}
