import type { FulfilmentType, OrderStatus } from "@/lib/types";

/** An order plus its lines, in one round-trip. RLS limits both halves to the
 *  signed-in owner, so there is nothing extra to filter here. */
export const ORDER_SELECT = `
  id, status, fulfilment_type, phone, address, notes,
  subtotal_cents, delivery_fee_cents, total_cents, created_at,
  order_items (
    id, menu_item_id, name_at_order, emoji_at_order,
    unit_price_cents, quantity, line_total_cents
  )
`;

/** Short, readable handle for an order — the full uuid is unfriendly. */
export function orderReference(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

/** The happy path, in order. `cancelled` is deliberately not here — it ends
 *  the journey rather than being a step along it. */
export const ORDER_PROGRESS: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
];

/** The last two steps read differently depending on how the food gets to you. */
export function statusLabel(
  status: OrderStatus,
  fulfilment: FulfilmentType
): string {
  switch (status) {
    case "pending":
      return "Waiting for the kitchen";
    case "confirmed":
      return "Confirmed";
    case "preparing":
      return "Being prepared";
    case "ready":
      return fulfilment === "delivery" ? "On the way" : "Ready for pickup";
    case "completed":
      return fulfilment === "delivery" ? "Delivered" : "Picked up";
    case "cancelled":
      return "Cancelled";
  }
}

export function statusColorClasses(status: OrderStatus): string {
  switch (status) {
    case "cancelled":
      return "bg-gray-100 text-gray-600";
    case "completed":
      return "bg-green-100 text-green-800";
    case "ready":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-amber-100 text-amber-800";
  }
}

/** Only a pending order can still be called off — this mirrors the
 *  `and status = 'pending'` in cancel_order(). */
export function canCancel(status: OrderStatus): boolean {
  return status === "pending";
}
