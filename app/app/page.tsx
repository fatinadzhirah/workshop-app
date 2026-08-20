import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import BrandHeader from "@/components/BrandHeader";
import BackendNotConnected from "@/components/BackendNotConnected";
import OrderStatusBadge from "@/components/OrderStatusBadge";
import ReorderButton from "@/components/ReorderButton";
import { brand } from "@/lib/config/brand";
import { formatPrice } from "@/lib/format";
import { ORDER_SELECT, orderReference } from "@/lib/orders";
import type { Order, OrderLine } from "@/lib/types";

type OrderWithLines = Order & { order_items: OrderLine[] };

export const metadata = { title: `Your orders — ${brand.name}` };

export default async function OrdersPage() {
  const supabase = await getSupabaseServerClient();

  // Modules 1–4: no backend yet — show the page shell, not a crash.
  if (!supabase) {
    return (
      <div className="min-h-screen bg-white">
        <BrandHeader />
        <main className="mx-auto max-w-2xl px-4 py-10">
          <h1 className="text-2xl font-bold">Your orders</h1>
          <div className="mt-4">
            <BackendNotConnected />
          </div>
        </main>
      </div>
    );
  }

  // Identity is verified ON THE SERVER — signed-out visitors never see this page.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // No .eq("user_id", …) needed: the RLS policy already limits this to your rows.
  const { data } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false });

  const orders = (data ?? []) as unknown as OrderWithLines[];

  return (
    <div className="min-h-screen bg-white">
      <BrandHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Your orders</h1>
          <Link
            href="/menu"
            className="rounded-md px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: brand.primaryColor }}
          >
            Order food
          </Link>
        </div>

        <div className="mt-8 space-y-4">
          {orders.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
              No orders yet —{" "}
              <Link href="/menu" className="underline" style={{ color: brand.primaryColor }}>
                have a look at the menu
              </Link>
              .
            </p>
          ) : (
            orders.map((order) => (
              <article key={order.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/app/orders/${order.id}`}
                      className="font-semibold hover:underline"
                    >
                      {orderReference(order.id)}
                    </Link>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleString()} ·{" "}
                      <span className="capitalize">{order.fulfilment_type}</span>
                    </p>
                  </div>
                  <OrderStatusBadge
                    status={order.status}
                    fulfilment={order.fulfilment_type}
                  />
                </div>

                <ul className="mt-3 space-y-1 text-sm text-gray-600">
                  {order.order_items.map((line) => (
                    <li key={line.id} className="break-words">
                      <span aria-hidden>{line.emoji_at_order}</span> {line.quantity} ×{" "}
                      {line.name_at_order}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
                  <span className="font-semibold">{formatPrice(order.total_cents)}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <ReorderButton lines={order.order_items} />
                    <Link
                      href={`/app/orders/${order.id}`}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      View
                    </Link>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
