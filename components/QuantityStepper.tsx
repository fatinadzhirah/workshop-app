"use client";

/** −/+ control shared by the menu cards and the cart drawer. */
export default function QuantityStepper({
  quantity,
  max,
  label,
  onChange,
}: {
  quantity: number;
  max: number;
  label: string;
  onChange: (next: number) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-md border border-gray-300">
      <button
        onClick={() => onChange(quantity - 1)}
        aria-label={`Remove one ${label}`}
        className="px-2.5 py-1 text-gray-700 hover:bg-gray-50"
      >
        −
      </button>
      <span className="min-w-8 text-center text-sm font-medium" aria-live="polite">
        {quantity}
      </span>
      <button
        onClick={() => onChange(quantity + 1)}
        disabled={quantity >= max}
        aria-label={`Add one more ${label}`}
        className="px-2.5 py-1 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
