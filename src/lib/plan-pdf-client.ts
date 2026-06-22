function isMobileBrowser(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(max-width: 640px)").matches ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  );
}

function pdfUrl(planId: string): string {
  return `/api/plans/${encodeURIComponent(planId)}/pdf`;
}

function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const match = /filename="([^"]+)"/i.exec(header);
  return match?.[1] ?? null;
}

export async function downloadPlanPdf(planId: string): Promise<void> {
  const url = pdfUrl(planId);

  if (isMobileBrowser()) {
    window.location.assign(url);
    return;
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Gagal mengunduh PDF");
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filenameFromDisposition(res.headers.get("Content-Disposition")) ?? "menu-mingguan.pdf";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
