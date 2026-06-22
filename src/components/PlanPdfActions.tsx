"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { downloadPlanPdf } from "@/lib/plan-pdf-client";
import { PageLoading } from "./PageLoading";

type Props = {
  planId: string;
  autoDownloadOnMobile?: boolean;
};

export function PlanPdfActions({ planId, autoDownloadOnMobile = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoStarted = useRef(false);

  const handleDownload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await downloadPlanPdf(planId);
    } catch {
      setError("Gagal mengunduh PDF. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    if (!autoDownloadOnMobile || autoStarted.current) return;
    const mobile =
      window.matchMedia("(max-width: 640px)").matches ||
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    if (!mobile) return;

    autoStarted.current = true;
    void handleDownload();
  }, [autoDownloadOnMobile, handleDownload]);

  return (
    <>
      {loading && <PageLoading message="Menyiapkan PDF..." />}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" className="btn-primary w-full sm:w-auto" onClick={() => void handleDownload()}>
            Unduh PDF
          </button>
          <button
            type="button"
            className="btn-secondary no-print hidden w-full sm:inline-flex sm:w-auto"
            onClick={() => window.print()}
          >
            Cetak
          </button>
        </div>
        {error && <p className="text-center text-sm text-red-700">{error}</p>}
        <p className="text-center text-xs text-ink-violet/80 sm:hidden">
          Di HP, PDF akan langsung diunduh. Buka folder Downloads jika belum muncul.
        </p>
      </div>
    </>
  );
}
