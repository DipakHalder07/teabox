import type { Metadata } from "next";
import { Suspense } from "react";
import CollectionLayoutWrapper from "@/components/CollectionLayoutWrapper";
import { COLLECTIONS } from "@/data/products";

interface PageProps {
  params: Promise<{ collection: string }>;
}

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({
    collection: c.id,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { collection } = await params;
  const col = COLLECTIONS.find((c) => c.id === collection) || {
    name: "All Collection",
    description: "Discover India's finest teas online - 100% fresh, delivered direct from the source.",
  };
  return {
    title: `${col.name} | Buy Fresh Indian Tea Online - Teabox`,
    description: col.description,
  };
}

async function CollectionContent({ params }: PageProps) {
  const { collection } = await params;
  return <CollectionLayoutWrapper collection={collection} />;
}

export default function CollectionPage(props: PageProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <CollectionContent {...props} />
    </Suspense>
  );
}
