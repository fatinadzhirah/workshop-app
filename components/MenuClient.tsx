"use client";

import { useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { brand } from "@/lib/config/brand";
import type { Category, MenuItem } from "@/lib/types";
import DishCard from "./DishCard";

const ALL = "all";

export default function MenuClient({
  categories,
  items,
  userId,
  initialFavouriteIds,
}: {
  categories: Category[];
  items: MenuItem[];
  /** Null when signed out — the menu still browses fine, hearts just link to sign-in. */
  userId: string | null;
  initialFavouriteIds: string[];
}) {
  const supabase = getSupabaseBrowserClient();
  const [activeCategory, setActiveCategory] = useState<string>(ALL);
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(
    () => new Set(initialFavouriteIds)
  );
  const [error, setError] = useState<string | null>(null);

  const visibleItems = useMemo(
    () =>
      activeCategory === ALL
        ? items
        : items.filter((item) => item.category_id === activeCategory),
    [items, activeCategory]
  );

  async function toggleFavourite(menuItemId: string) {
    if (!supabase || !userId) return;
    const wasFavourite = favouriteIds.has(menuItemId);

    // Flip it straight away — a heart that lags feels broken.
    setFavouriteIds((current) => {
      const next = new Set(current);
      if (wasFavourite) next.delete(menuItemId);
      else next.add(menuItemId);
      return next;
    });
    setError(null);

    // user_id comes from the server-verified session — NEVER from the page.
    const { error: writeError } = wasFavourite
      ? await supabase
          .from("favourites")
          .delete()
          .eq("user_id", userId)
          .eq("menu_item_id", menuItemId)
      : await supabase.from("favourites").insert({ user_id: userId, menu_item_id: menuItemId });

    if (writeError) {
      // Put the heart back where it was so the page never lies about what's saved.
      setFavouriteIds((current) => {
        const next = new Set(current);
        if (wasFavourite) next.add(menuItemId);
        else next.delete(menuItemId);
        return next;
      });
      setError("Couldn't save that favourite. Please try again.");
    }
  }

  const tabs = [{ id: ALL, name: "Everything" }, ...categories];

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = tab.id === activeCategory;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                active ? "border-transparent text-white" : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              style={active ? { backgroundColor: brand.primaryColor } : undefined}
            >
              {tab.name}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {visibleItems.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
          Nothing in this section yet.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item) => (
            <DishCard
              key={item.id}
              item={item}
              isFavourite={favouriteIds.has(item.id)}
              onToggleFavourite={userId ? toggleFavourite : null}
            />
          ))}
        </div>
      )}
    </>
  );
}
