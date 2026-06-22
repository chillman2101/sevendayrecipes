"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function RecipeBackLinkInner() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const isPlanReturn = from?.startsWith("/plan/") ?? false;
  const isBrowseReturn = from === "/browse";
  const href = isPlanReturn || isBrowseReturn ? from! : "/";
  const label = isPlanReturn
    ? "← Kembali ke menu"
    : isBrowseReturn
      ? "← Kembali ke pencarian"
      : "← Kembali";

  return (
    <Link href={href} className="no-print mb-6 inline-block text-sm hover:underline md:mb-8 md:text-body-sm">
      {label}
    </Link>
  );
}

export function RecipeBackLink() {
  return (
    <Suspense fallback={<span className="mb-6 inline-block text-sm md:mb-8">← Kembali</span>}>
      <RecipeBackLinkInner />
    </Suspense>
  );
}
