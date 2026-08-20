"use client";

import { useState } from "react";
import { MAX_QUANTITY, useCart } from "@/lib/cart";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { MENU_ITEM_COLUMNS } from "@/lib/menu";
import type { CartLine, MenuItem, OrderLine } from "@/lib/types";

/**
 * "Order again" — refills the cart from a past order.
 *
 * It deliberately re-reads the menu instead of trusting the snapshot stored on
 * the order: a dish may have changed price or sold out since. What you get is
 * today's menu, not last week's receipt.
 */
export default function ReorderButton({
  lines,
  className,
}: {
  lines: OrderLine[];
  className?: string;
}) {
  const { replaceAll, openDrawer, lines: cartLines } = useCart();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reorder() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const wantedIds = lines
      .map((line) => line.menu_item_id)
      .filter((id): id is string => id !== null);

    if (wantedIds.length === 0) {
      setError("None of those dishes are on the menu any more.");
      return;
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    const { data, error: readError } = await supabase
      .from("menu_items")
      .select(MENU_ITEM_COLUMNS)
      .in("id", wantedIds)
      .eq("is_available", true);

    setBusy(false);

    if (readError) {
      setError("Couldn't reach the menu. Please try again.");
      return;
    }

    const available = new Map((data as MenuItem[]).map((item) => [item.id, item]));
    const refilled: CartLine[] = [];

    for (const line of lines) {
      const item = line.menu_item_id ? available.get(line.menu_item_id) : undefined;
      if (!item) continue;
      refilled.push({
        menu_item_id: item.id,
        name: item.name,
        emoji: item.emoji,
        price_cents: item.price_cents,
        quantity: Math.min(line.quantity, MAX_QUANTITY),
      });
    }

    if (refilled.length === 0) {
      setError("None of those dishes are available right now.");
      return;
    }

    replaceAll(refilled);
    setConfirming(false);

    const skipped = lines.length - refilled.length;
    setMessage(
      skipped > 0
        ? `Added ${refilled.length} back to your cart. ${skipped} ${skipped === 1 ? "dish is" : "dishes are"} no longer available.`
        : "Added back to your cart."
    );
    openDrawer();
  }

  function handleClick() {
    // Replacing a cart someone is mid-way through building would be rude.
    if (cartLines.length > 0 && !confirming) {
      setConfirming(true);
      return;
    }
    void reorder();
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleClick}
          disabled={busy}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {busy ? "Adding…" : confirming ? "Replace your cart?" : "Order again"}
        </button>
        {confirming && (
          <button
            onClick={() => setConfirming(false)}
            className="rounded-md px-2 py-1.5 text-sm text-gray-500 underline"
          >
            Keep my cart
          </button>
        )}
      </div>
      {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
