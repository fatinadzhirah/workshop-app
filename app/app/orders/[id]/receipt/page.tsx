import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import BrandHeader from "@/components/BrandHeader";
import BackendNotConnected from "@/components/BackendNotConnected";
import PrintButton from "@/components/PrintButton";
import { brand } from "@/lib/config/brand";
import { formatPrice } from "@/lib/format";
import { ORDER_SELECT, orderReference, statusLabel } from "@/lib/orders";
import type { Order, OrderLine } from "@/lib/types";

type OrderWithLines = Order & { order_items: OrderLine[] };

export const metadata = { title: `Receipt — ${brand.name}` };

export default async function ReceiptPage(
  props: PageProps<"/app/orders/[id]/receipt">
) {
  const { id } = await props.params;
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white">
        <BrandHeader />
        <main className="mx-auto max-w-2xl px-4 py-10">
          <h1 className="text-2xl font-bold">Receipt</h1>
          <div className="mt-4">
            <BackendNotConnected />
          </div>
        </main>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Same story as the order page: someone else's id returns nothing, because
  // the RLS policy refuses to hand the row over.
  const { data } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const order = data as unknown as OrderWithLines;

  return (
    <div className="min-h-screen bg-white">
      <div className="print:hidden">
        <BrandHeader />
      </div>

      <main className="mx-auto max-w-md px-4 py-8">
        <section className="text-center print:hidden">
          <span
            aria-hidden
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full text-2xl text-white"
            style={{ backgroundColor: brand.primaryColor }}
          >
            ✓
          </span>
          <h1 className="mt-4 text-2xl font-bold">Order confirmed</h1>
          <p className="mt-1 text-gray-600">
            Thanks — the kitchen has your order. Here&apos;s your receipt.
          </p>
        </section>

        {/* The receipt itself: the only part that reaches the printer. */}
        <article className="mt-8 rounded-xl border border-dashed border-gray-300 p-6 print:mt-0 print:border-none print:p-0">
          <header className="text-center">
            <h2 className="text-lg font-semibold" style={{ color: brand.primaryColor }}>
              {brand.name}
            </h2>
            <p className="text-xs text-gray-500">{brand.tagline}</p>
          </header>

          <dl className="mt-6 space-y-1 font-mono text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Order</dt>
              <dd className="font-semibold">{orderReference(order.id)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Placed</dt>
              <dd>{new Date(order.created_at).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Type</dt>
              <dd className="capitalize">{order.fulfilment_type}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Status</dt>
              <dd>{statusLabel(order.status, order.fulfilment_type)}</dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-dashed border-gray-300 pt-4">
            <ul className="space-y-2 font-mono text-xs">
              {order.order_items.map((line) => (
                <li key={line.id} className="flex justify-between gap-3">
                  <span className="min-w-0 break-words">
                    {line.quantity} × {line.name_at_order}
                    <span className="block text-gray-500">
                      @ {formatPrice(line.unit_price_cents)}
                    </span>
                  </span>
                  <span className="shrink-0">{formatPrice(line.line_total_cents)}</span>
                </li>
              ))}
            </ul>
          </div>

          <dl className="mt-4 space-y-1 border-t border-dashed border-gray-300 pt-4 font-mono text-xs">
            <div className="flex justify-between gap-3">
              <dt className="text-gray-500">Subtotal</dt>
              <dd>{formatPrice(order.subtotal_cents)}</dd>
            </div>
            {order.delivery_fee_cents > 0 && (
              <div className="flex justify-between gap-3">
                <dt className="text-gray-500">Delivery</dt>
                <dd>{formatPrice(order.delivery_fee_cents)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-3 pt-2 text-sm font-bold">
              <dt>Total</dt>
              <dd>{formatPrice(order.total_cents)}</dd>
            </div>
          </dl>

          <div className="mt-6 space-y-2 border-t border-dashed border-gray-300 pt-4 text-xs">
            {/* Customer-entered text, rendered as plain text. */}
            <p>
              <span className="text-gray-500">Phone: </span>
              <span className="break-words">{order.phone}</span>
            </p>
            {order.address && (
              <p>
                <span className="text-gray-500">Deliver to: </span>
                <span className="break-words whitespace-pre-wrap">{order.address}</span>
              </p>
            )}
            {order.notes && (
              <p>
                <span className="text-gray-500">Notes: </span>
                <span className="break-words whitespace-pre-wrap">{order.notes}</span>
              </p>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            Quote {orderReference(order.id)} if you need to ask about this order.
            <br />
            Thank you — see you again soon.
          </p>
        </article>

        <div className="mt-6 flex flex-wrap justify-center gap-3 print:hidden">
          <PrintButton />
          <Link
            href={`/app/orders/${order.id}`}
            className="rounded-md px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: brand.primaryColor }}
          >
            Track this order
          </Link>
          <Link
            href="/menu"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Order more
          </Link>
        </div>
      </main>
    </div>
  );
}
