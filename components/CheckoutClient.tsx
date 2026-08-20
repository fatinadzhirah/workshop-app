"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { brand } from "@/lib/config/brand";
import { formatPrice } from "@/lib/format";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { FulfilmentType, RestaurantSettings } from "@/lib/types";

export const PHONE_MIN = 6;
export const PHONE_MAX = 30;
export const ADDRESS_MAX = 400;
export const NOTES_MAX = 500;

/** Mirrors the checks inside place_order(). The database has the final say —
 *  this only saves the user a round-trip. */
export function validateCheckout(
  fulfilment: FulfilmentType,
  phone: string,
  address: string
): string | null {
  const trimmedPhone = phone.trim();
  if (trimmedPhone.length < PHONE_MIN) return "Please give a contact phone number.";
  if (trimmedPhone.length > PHONE_MAX) return "That phone number looks too long.";
  if (fulfilment === "delivery" && address.trim().length === 0)
    return "Please give a delivery address.";
  if (address.length > ADDRESS_MAX) return "Keep the address under 400 characters.";
  return null;
}

export default function CheckoutClient({ settings }: { settings: RestaurantSettings }) {
  const router = useRouter();
  const { lines, subtotalCents, clear, hydrated } = useCart();

  const [fulfilment, setFulfilment] = useState<FulfilmentType>("pickup");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const deliveryFee = fulfilment === "delivery" ? settings.delivery_fee_cents : 0;
  const totalCents = subtotalCents + deliveryFee;
  const belowMinimum = subtotalCents < settings.min_order_cents;

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    const invalid = validateCheckout(fulfilment, phone, address);
    if (invalid) {
      setError(invalid);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Backend not connected.");
      return;
    }

    setBusy(true);
    setError(null);

    // We send dish ids and quantities. NOT prices — place_order() looks every
    // price up in the database and computes the total itself, so a tampered
    // cart can't buy anything cheaply.
    const { data, error: rpcError } = await supabase.rpc("place_order", {
      p_items: lines.map((l) => ({
        menu_item_id: l.menu_item_id,
        quantity: l.quantity,
      })),
      p_fulfilment: fulfilment,
      p_phone: phone.trim(),
      p_address: fulfilment === "delivery" ? address.trim() : null,
      p_notes: notes.trim() || null,
    });

    if (rpcError || !data) {
      setBusy(false);
      setError(rpcError?.message ?? "Couldn't place that order. Please try again.");
      return;
    }

    clear();
    // Straight to the receipt — the confirmation of what was actually charged.
    router.push(`/app/orders/${data}/receipt`);
    router.refresh();
  }

  // The cart is read from localStorage after mount, so until that's done we
  // don't yet know whether there's anything to check out.
  if (!hydrated) {
    return <p className="mt-6 text-gray-500">Loading your cart…</p>;
  }

  if (lines.length === 0) {
    return (
      <p className="mt-6 rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
        Your cart is empty.{" "}
        <Link href="/menu" className="underline" style={{ color: brand.primaryColor }}>
          Browse the menu
        </Link>
        .
      </p>
    );
  }

  return (
    <form onSubmit={handlePlaceOrder} className="mt-6 space-y-6">
      <fieldset className="rounded-xl border border-gray-200 p-4">
        <legend className="px-1 text-sm font-medium">How would you like it?</legend>
        <div className="mt-2 flex gap-2">
          {(["pickup", "delivery"] as const).map((option) => {
            const active = fulfilment === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setFulfilment(option)}
                aria-pressed={active}
                className={`flex-1 rounded-md border px-4 py-2 text-sm font-medium capitalize ${
                  active
                    ? "border-transparent text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
                style={active ? { backgroundColor: brand.primaryColor } : undefined}
              >
                {option}
                {option === "delivery" && settings.delivery_fee_cents > 0 && (
                  <span className="ml-1 font-normal">
                    (+{formatPrice(settings.delivery_fee_cents)})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="space-y-4 rounded-xl border border-gray-200 p-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium">
            Phone number
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            maxLength={PHONE_MAX}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 012-345 6789"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-2 focus:outline-offset-1"
          />
          <p className="mt-1 text-xs text-gray-500">
            So the kitchen can reach you about this order.
          </p>
        </div>

        {fulfilment === "delivery" && (
          <div>
            <label htmlFor="address" className="block text-sm font-medium">
              Delivery address
            </label>
            <textarea
              id="address"
              rows={3}
              maxLength={ADDRESS_MAX}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Unit, street, postcode"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-2 focus:outline-offset-1"
            />
          </div>
        )}

        <div>
          <label htmlFor="notes" className="block text-sm font-medium">
            Notes <span className="font-normal text-gray-500">(optional)</span>
          </label>
          <textarea
            id="notes"
            rows={2}
            maxLength={NOTES_MAX}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Less spicy, no peanuts, leave at the door…"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-2 focus:outline-offset-1"
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold">Your order</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {lines.map((line) => (
            <li key={line.menu_item_id} className="flex justify-between gap-3">
              <span className="min-w-0 break-words">
                <span aria-hidden>{line.emoji}</span> {line.quantity} × {line.name}
              </span>
              <span className="shrink-0">
                {formatPrice(line.price_cents * line.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-1 border-t border-gray-200 pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-600">Subtotal</dt>
            <dd>{formatPrice(subtotalCents)}</dd>
          </div>
          {fulfilment === "delivery" && (
            <div className="flex justify-between">
              <dt className="text-gray-600">Delivery</dt>
              <dd>{formatPrice(deliveryFee)}</dd>
            </div>
          )}
          <div className="flex justify-between pt-1 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatPrice(totalCents)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-gray-500">
          Prices are confirmed by the kitchen when the order is placed.
        </p>
      </div>

      {belowMinimum && (
        <p className="text-sm text-amber-700">
          Minimum order is {formatPrice(settings.min_order_cents)} — add a little more
          to check out.
        </p>
      )}
      {!settings.is_open && (
        <p className="text-sm text-amber-700">
          The kitchen is closed right now. Orders can&apos;t be placed until it reopens.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy || belowMinimum || !settings.is_open || lines.length === 0}
        className="w-full rounded-md px-4 py-3 font-medium text-white disabled:opacity-60"
        style={{ backgroundColor: brand.primaryColor }}
      >
        {busy ? "Placing order…" : `Place order · ${formatPrice(totalCents)}`}
      </button>
    </form>
  );
}
