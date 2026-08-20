"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/** Cancelling goes through cancel_order() — there is no update policy on
 *  orders, so this is the only route, and it only works while pending. */
export default function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setBusy(true);
    setError(null);
    const { error: rpcError } = await supabase.rpc("cancel_order", {
      p_order_id: orderId,
    });
    setBusy(false);

    if (rpcError) {
      setError(rpcError.message || "Couldn't cancel that order.");
      setConfirming(false);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {confirming ? (
          <>
            <button
              onClick={handleCancel}
              disabled={busy}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            >
              {busy ? "Cancelling…" : "Yes, cancel it"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Keep the order
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
          >
            Cancel order
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
