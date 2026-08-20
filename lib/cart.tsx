"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartLine, MenuItem } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// THE CART LIVES IN THE BROWSER — never in the database.
// It holds dish ids and quantities. Prices are carried along only
// so the drawer can show a running total; the real receipt is
// computed by place_order() in Postgres at checkout.
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "cart.v1";

/** Matches the quantity check on order_items — don't let the UI promise
 *  something the database will refuse. */
export const MAX_QUANTITY = 20;

type CartContextValue = {
  lines: CartLine[];
  /** False until localStorage has been read, so the badge never flashes a stale 0. */
  hydrated: boolean;
  count: number;
  subtotalCents: number;
  add: (item: MenuItem, quantity?: number) => void;
  setQuantity: (menuItemId: string, quantity: number) => void;
  remove: (menuItemId: string) => void;
  clear: () => void;
  /** Used by "Order again": swap the whole cart in one go. */
  replaceAll: (lines: CartLine[]) => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function readStoredLines(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Anything malformed is dropped rather than trusted — this string is
    // editable by anyone with devtools open.
    return parsed.flatMap((entry) => {
      if (typeof entry !== "object" || entry === null) return [];
      const line = entry as Partial<CartLine>;
      if (typeof line.menu_item_id !== "string") return [];
      if (typeof line.name !== "string") return [];
      const quantity = Number(line.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) return [];
      return [
        {
          menu_item_id: line.menu_item_id,
          name: line.name,
          emoji: typeof line.emoji === "string" ? line.emoji : "🍽️",
          price_cents: Number.isFinite(Number(line.price_cents))
            ? Number(line.price_cents)
            : 0,
          quantity: Math.min(quantity, MAX_QUANTITY),
        },
      ];
    });
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Read on mount, not during render: the server has no localStorage, and
  // reading it while rendering would make the first client paint disagree.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional read-on-mount
    setLines(readStoredLines());
    setHydrated(true);
  }, []);

  // Write back only after the first read, or we'd erase a saved cart.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Private browsing or a full quota — the cart just won't survive a reload.
    }
  }, [lines, hydrated]);

  const add = useCallback((item: MenuItem, quantity = 1) => {
    setLines((current) => {
      const existing = current.find((l) => l.menu_item_id === item.id);
      if (existing) {
        return current.map((l) =>
          l.menu_item_id === item.id
            ? { ...l, quantity: Math.min(l.quantity + quantity, MAX_QUANTITY) }
            : l
        );
      }
      return [
        ...current,
        {
          menu_item_id: item.id,
          name: item.name,
          emoji: item.emoji,
          price_cents: item.price_cents,
          quantity: Math.min(quantity, MAX_QUANTITY),
        },
      ];
    });
  }, []);

  const setQuantity = useCallback((menuItemId: string, quantity: number) => {
    setLines((current) =>
      quantity < 1
        ? current.filter((l) => l.menu_item_id !== menuItemId)
        : current.map((l) =>
            l.menu_item_id === menuItemId
              ? { ...l, quantity: Math.min(quantity, MAX_QUANTITY) }
              : l
          )
    );
  }, []);

  const remove = useCallback((menuItemId: string) => {
    setLines((current) => current.filter((l) => l.menu_item_id !== menuItemId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const replaceAll = useCallback((next: CartLine[]) => setLines(next), []);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    return {
      lines,
      hydrated,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotalCents: lines.reduce((sum, l) => sum + l.price_cents * l.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
      replaceAll,
      drawerOpen,
      openDrawer,
      closeDrawer,
    };
  }, [
    lines,
    hydrated,
    add,
    setQuantity,
    remove,
    clear,
    replaceAll,
    drawerOpen,
    openDrawer,
    closeDrawer,
  ]);

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside <CartProvider>.");
  return context;
}
