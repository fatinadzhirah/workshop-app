"use client";

/** Opens the browser's print dialog. The `print:hidden` classes around the
 *  page take care of leaving the navigation and buttons off the paper. */
export default function PrintButton({ label = "Print receipt" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
    >
      {label}
    </button>
  );
}
