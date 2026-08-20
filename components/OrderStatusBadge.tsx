import { statusColorClasses, statusLabel } from "@/lib/orders";
import type { FulfilmentType, OrderStatus } from "@/lib/types";

export default function OrderStatusBadge({
  status,
  fulfilment,
}: {
  status: OrderStatus;
  fulfilment: FulfilmentType;
}) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusColorClasses(status)}`}
    >
      {statusLabel(status, fulfilment)}
    </span>
  );
}
