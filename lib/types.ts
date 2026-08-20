// Shared shapes for everything the app reads out of Supabase.
// These mirror supabase/workshop-schema.sql — if you change a column
// there, change it here too.

export type Category = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  emoji: string;
  price_cents: number;
  is_available: boolean;
  sort_order: number;
};

export type RestaurantSettings = {
  delivery_fee_cents: number;
  min_order_cents: number;
  is_open: boolean;
};

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type FulfilmentType = "pickup" | "delivery";

export type Order = {
  id: string;
  status: OrderStatus;
  fulfilment_type: FulfilmentType;
  phone: string;
  address: string | null;
  notes: string | null;
  subtotal_cents: number;
  delivery_fee_cents: number;
  total_cents: number;
  created_at: string;
};

export type OrderLine = {
  id: string;
  menu_item_id: string | null;
  name_at_order: string;
  emoji_at_order: string;
  unit_price_cents: number;
  quantity: number;
  line_total_cents: number;
};

/** One line of the browser-side cart. The price is for display only —
 *  place_order() re-reads the real price from the database. */
export type CartLine = {
  menu_item_id: string;
  name: string;
  emoji: string;
  price_cents: number;
  quantity: number;
};
