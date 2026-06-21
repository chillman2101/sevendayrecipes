"use client";

export function PrintButton() {
  return (
    <button type="button" className="btn-primary no-print" onClick={() => window.print()}>
      Cetak / Save PDF
    </button>
  );
}
