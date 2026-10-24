"use client";

import { useParams } from "next/navigation";
import ProductEditor from "@/components/admin/ProductEditor";

// Reads the product id in the browser, so opening a product from the list is instant
export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  return <ProductEditor key={id} id={decodeURIComponent(id)} />;
}
