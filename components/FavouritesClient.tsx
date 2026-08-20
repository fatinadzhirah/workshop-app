"use client";

import { useState } from "react";
import Link from "next/link";
import { brand } from "@/lib/config/brand";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { MenuItem } from "@/lib/types";
import DishCard from "./DishCard";

/** The hearted dishes. Un-hearting removes the card — this page is the list
 *  of what's hearted, so a card with an empty heart would be a contradiction. */
export default function FavouritesClient({
  userId,
  initialItems,
}: {
  userId: string;
  initialItems: MenuItem[];
}) {
  const supabase = getSupabaseBrowserClient();
  const [items, setItems] = useState<MenuItem[]>(initialItems);
  const [error, setError] = useState<string | null>(null);

  async function removeFavourite(menuItemId: string) {
    if (!supabase) return;
    const removed = items.find((item) => item.id === menuItemId);
    if (!removed) return;

    setItems((current) => current.filter((item) => item.id !== menuItemId));
    setError(null);

    const { error: deleteError } = await supabase
      .from("favourites")
      .delete()
      .eq("user_id", userId)
      .eq("menu_item_id", menuItemId);

    if (deleteError) {
      // Put it back — the page must never claim something was removed when it wasn't.
      setItems((current) =>
        [...current, removed].sort((a, b) => a.sort_order - b.sort_order)
      );
      setError("Couldn't remove that favourite. Please try again.");
    }
  }

  if (items.length === 0) {
    return (
      <p className="mt-6 rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
        Nothing hearted yet. Tap ♡ on a dish in the{" "}
        <Link href="/menu" className="underline" style={{ color: brand.primaryColor }}>
          menu
        </Link>{" "}
        to keep it here.
      </p>
    );
  }

  return (
    <>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <DishCard
            key={item.id}
            item={item}
            isFavourite
            onToggleFavourite={removeFavourite}
          />
        ))}
      </div>
    </>
  );
}
