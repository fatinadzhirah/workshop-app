"use client";

import { useCart } from "@/lib/cart";
import { brand } from "@/lib/config/brand";
import CartDrawer from "./CartDrawer";

/** The cart button in the header, plus the drawer it opens.
 *  Both live here so every page gets the cart for free. */
export default function CartButton() {
  const { count, hydrated, openDrawer } = useCart();

  return (
    <>
      <button
        onClick={openDrawer}
        aria-label={count === 1 ? "Cart, 1 item" : `Cart, ${count} items`}
        className="relative rounded-md border border-gray-300 px-2 py-1.5 text-gray-700 hover:bg-gray-50 sm:px-3"
      >
        <span aria-hidden>🛒</span>
        <span className="ml-1 hidden sm:inline">Cart</span>
        {hydrated && count > 0 && (
          <span
            className="absolute -top-2 -right-2 min-w-5 rounded-full px-1.5 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: brand.primaryColor }}
          >
            {count}
          </span>
        )}
      </button>
      <CartDrawer />
    </>
  );
}
