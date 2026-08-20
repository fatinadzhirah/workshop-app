import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, MenuItem, RestaurantSettings } from "@/lib/types";

// Server-side reads of the public menu. The select policies in
// workshop-schema.sql make these work with or without a session, which is
// why the menu renders for signed-out visitors.

export const MENU_ITEM_COLUMNS =
  "id, category_id, name, slug, description, emoji, price_cents, is_available, sort_order";

export async function loadMenu(supabase: SupabaseClient): Promise<{
  categories: Category[];
  items: MenuItem[];
}> {
  const [categoriesResult, itemsResult] = await Promise.all([
    supabase.from("categories").select("id, name, slug, sort_order").order("sort_order"),
    supabase
      .from("menu_items")
      .select(MENU_ITEM_COLUMNS)
      .order("sort_order")
      .order("name"),
  ]);

  return {
    categories: (categoriesResult.data ?? []) as Category[],
    items: (itemsResult.data ?? []) as MenuItem[],
  };
}

export async function loadSettings(
  supabase: SupabaseClient
): Promise<RestaurantSettings> {
  const { data } = await supabase
    .from("restaurant_settings")
    .select("delivery_fee_cents, min_order_cents, is_open")
    .maybeSingle();

  // Sensible fallbacks so a missing settings row can't blank the checkout page.
  return (data as RestaurantSettings | null) ?? {
    delivery_fee_cents: 0,
    min_order_cents: 0,
    is_open: true,
  };
}

export async function loadFavouriteIds(supabase: SupabaseClient): Promise<string[]> {
  // RLS already limits this to the signed-in user's rows.
  const { data } = await supabase.from("favourites").select("menu_item_id");
  return (data ?? []).map((row) => row.menu_item_id as string);
}
