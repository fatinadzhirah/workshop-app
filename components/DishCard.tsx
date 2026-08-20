"use client";

import { MAX_QUANTITY, useCart } from "@/lib/cart";
import { brand } from "@/lib/config/brand";
import { formatPrice } from "@/lib/format";
import type { MenuItem } from "@/lib/types";
import QuantityStepper from "./QuantityStepper";
import FavouriteButton from "./FavouriteButton";

export default function DishCard({
  item,
  isFavourite,
  onToggleFavourite,
}: {
  item: MenuItem;
  isFavourite: boolean;
  /** Null when nobody is signed in — the heart then points at sign-in. */
  onToggleFavourite: ((menuItemId: string) => void) | null;
}) {
  const { lines, add, setQuantity } = useCart();
  const inCart = lines.find((l) => l.menu_item_id === item.id)?.quantity ?? 0;

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-2">
        <span aria-hidden className="text-4xl">
          {item.emoji}
        </span>
        <FavouriteButton
          isFavourite={isFavourite}
          dishName={item.name}
          onToggle={onToggleFavourite ? () => onToggleFavourite(item.id) : null}
        />
      </div>

      {/* Dish text comes from the database and is rendered as plain text. */}
      <h3 className="mt-3 font-semibold break-words">{item.name}</h3>
      {item.description && (
        <p className="mt-1 flex-1 text-sm break-words text-gray-600">
          {item.description}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="font-semibold">{formatPrice(item.price_cents)}</span>
        {!item.is_available ? (
          <span className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-500">
            Sold out
          </span>
        ) : inCart > 0 ? (
          <QuantityStepper
            quantity={inCart}
            max={MAX_QUANTITY}
            label={item.name}
            onChange={(next) => setQuantity(item.id, next)}
          />
        ) : (
          <button
            onClick={() => add(item)}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
            style={{ backgroundColor: brand.primaryColor }}
          >
            Add
          </button>
        )}
      </div>
    </div>
  );
}
