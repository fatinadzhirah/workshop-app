import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import BrandHeader from "@/components/BrandHeader";
import BackendNotConnected from "@/components/BackendNotConnected";
import OrderTimeline from "@/components/OrderTimeline";
import CancelOrderButton from "@/components/CancelOrderButton";
import ReorderButton from "@/components/ReorderButton";
import { brand } from "@/lib/config/brand";
import { formatPrice } from "@/lib/format";
import { ORDER_SELECT, canCancel, orderReference } from "@/lib/orders";
import type { Order, OrderLine } from "@/lib/types";

type OrderWithLines = Order & { order_items: OrderLine[] };

export default async function OrderDetailPage(props: PageProps<"/app/orders/[id]">) {
  const { id } = await props.params;
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white">
        <BrandHeader />
        <main className="mx-auto max-w-2xl px-4 py-10">
          <h1 className="text-2xl font-bold">Your order</h1>
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

  // Someone else's order id returns nothing here — not because of an `if` in
  // this file, but because the RLS policy refuses to hand the row over.
  const { data } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const order = data as unknown as OrderWithLines;

  return (
    <div className="min-h-screen bg-white">
      <BrandHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/app" className="text-sm text-gray-500 hover:underline">
          ← All orders
        </Link>

        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold">Order {orderReference(order.id)}</h1>
          <p className="text-sm text-gray-500">
            {new Date(order.created_at).toLocaleString()}
          </p>
        </div>

        <section className="mt-6 rounded-xl border border-gray-200 p-4">
          <h2 className="mb-4 font-semibold">Progress</h2>
          <OrderTimeline status={order.status} fulfilment={order.fulfilment_type} />
        </section>

        <section className="mt-4 rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold">
            {order.fulfilment_type === "delivery" ? "Delivery" : "Pickup"}
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Phone</dt>
              {/* Everything the customer typed is rendered as plain text. */}
              <dd className="break-words">{order.phone}</dd>
            </div>
            {order.address && (
              <div>
                <dt className="text-gray-500">Address</dt>
                <dd className="break-words whitespace-pre-wrap">{order.address}</dd>
              </div>
            )}
            {order.notes && (
              <div>
                <dt className="text-gray-500">Notes</dt>
                <dd className="break-words whitespace-pre-wrap">{order.notes}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="mt-4 rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold">Items</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {order.order_items.map((line) => (
              <li key={line.id} className="flex justify-between gap-3">
                <span className="min-w-0 break-words">
                  <span aria-hidden>{line.emoji_at_order}</span> {line.quantity} ×{" "}
                  {line.name_at_order}
                  <span className="text-gray-500">
                    {" "}
                    ({formatPrice(line.unit_price_cents)} each)
                  </span>
                </span>
                <span className="shrink-0">{formatPrice(line.line_total_cents)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-1 border-t border-gray-200 pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Subtotal</dt>
              <dd>{formatPrice(order.subtotal_cents)}</dd>
            </div>
            {order.delivery_fee_cents > 0 && (
              <div className="flex justify-between">
                <dt className="text-gray-600">Delivery</dt>
                <dd>{formatPrice(order.delivery_fee_cents)}</dd>
              </div>
            )}
            <div className="flex justify-between pt-1 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(order.total_cents)}</dd>
            </div>
          </dl>
        </section>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-start gap-2">
            <ReorderButton lines={order.order_items} />
            <Link
              href={`/app/orders/${order.id}/receipt`}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              View receipt
            </Link>
          </div>
          {canCancel(order.status) && <CancelOrderButton orderId={order.id} />}
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Questions about this order? Call {brand.name} and quote{" "}
          {orderReference(order.id)}.
        </p>
      </main>
    </div>
  );
}
