import { brand } from "@/lib/config/brand";

/**
 * Every price in this app is stored as a whole number of cents/sen — integers
 * never drift the way 0.1 + 0.2 does. This is the only place they turn into
 * something a human reads.
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: brand.currency,
  }).format(cents / 100);
}
