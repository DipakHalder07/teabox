"use client";

import { useEffect, useState } from "react";

/**
 * Whether Cash on Delivery is switched on in the admin. Assumed on until the answer arrives;
 * the setter lets the checkout hide COD when the server refuses a COD order.
 */
export function useCodAvailable() {
  const [codAvailable, setCodAvailable] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/checkout/options", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) setCodAvailable(data.cod !== false);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return [codAvailable, setCodAvailable] as const;
}
