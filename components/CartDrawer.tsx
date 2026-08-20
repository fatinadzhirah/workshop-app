"use client";

import { useEffect } from "react";
import Link from "next/link";
import { MAX_QUANTITY, useCart } from "@/lib/cart";
import { brand } from "@/lib/config/brand";
import { formatPrice } from "@/lib/format";
import QuantityStepper from "./QuantityStepper";

/** Slide-over cart. Rendered by CartButton, so it's on every page. */
export default function CartDrawer() {
  const { lines, subtotalCents, count, setQuantity, remove, drawerOpen, closeDrawer } =
    useCart();

  // Escape closes it, and the page behind shouldn't scroll while it's open.
  useEffect(() => {
    if (!drawerOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close cart"
        onClick={closeDrawer}
        className="absolute inset-0 bg-black/30"
      />

      <aside
        role="dialog"
        aria-label="Your cart"
        className="relative flex h-full w-full max-w-sm flex-col bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-lg font-semibold">
            Your cart{count > 0 && <span className="text-gray-500"> ({count})</span>}
          </h2>
          <button
            onClick={closeDrawer}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {lines.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
              Nothing here yet.{" "}
              <Link
                href="/menu"
                onClick={closeDrawer}
                className="underline"
                style={{ color: brand.primaryColor }}
              >
                Browse the menu
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-4">
              {lines.map((line) => (
                <li key={line.menu_item_id} className="flex gap-3">
                  <span aria-hidden className="text-2xl">
                    {line.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-medium">{line.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatPrice(line.price_cents)} each
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <QuantityStepper
                        quantity={line.quantity}
                        max={MAX_QUANTITY}
                        label={line.name}
                        onChange={(next) => setQuantity(line.menu_item_id, next)}
                      />
                      <button
                        onClick={() => remove(line.menu_item_id)}
                        className="text-sm text-gray-500 underline hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <span className="shrink-0 font-medium">
                    {formatPrice(line.price_cents * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-gray-200 px-4 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">{formatPrice(subtotalCents)}</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Delivery fee, if any, is added at checkout.
            </p>
            <Link
              href="/checkout"
              onClick={closeDrawer}
              className="mt-4 block rounded-md px-4 py-2.5 text-center font-medium text-white"
              style={{ backgroundColor: brand.primaryColor }}
            >
              Go to checkout
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
