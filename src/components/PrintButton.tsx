"use client";

export function PrintButton() {
  return (
    <button type="button" className="btn-primary no-print w-full sm:w-auto" onClick={() => window.print()}>
      Cetak / Save PDF
    </button>
  );
}
