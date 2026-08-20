import { brand } from "@/lib/config/brand";
import { ORDER_PROGRESS, statusLabel } from "@/lib/orders";
import type { FulfilmentType, OrderStatus } from "@/lib/types";

/** Where this order is along pending → confirmed → preparing → ready → done.
 *  A cancelled order leaves the track, so it gets its own line instead. */
export default function OrderTimeline({
  status,
  fulfilment,
}: {
  status: OrderStatus;
  fulfilment: FulfilmentType;
}) {
  if (status === "cancelled") {
    return (
      <p className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        This order was cancelled.
      </p>
    );
  }

  const currentIndex = ORDER_PROGRESS.indexOf(status);

  return (
    <ol className="space-y-3">
      {ORDER_PROGRESS.map((step, index) => {
        const done = index < currentIndex;
        const current = index === currentIndex;
        return (
          <li key={step} className="flex items-center gap-3">
            <span
              aria-hidden
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                done || current ? "border-transparent text-white" : "border-gray-300 text-gray-400"
              }`}
              style={done || current ? { backgroundColor: brand.primaryColor } : undefined}
            >
              {done ? "✓" : index + 1}
            </span>
            <span
              className={
                current
                  ? "font-semibold"
                  : done
                    ? "text-gray-700"
                    : "text-gray-400"
              }
            >
              {statusLabel(step, fulfilment)}
              {current && <span className="sr-only"> (current step)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
