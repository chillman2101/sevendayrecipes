import { BrowseClient } from "@/components/BrowseClient";
import { getPopularTokens } from "@/lib/recipes";
import { RECIPE_COUNT_LABEL } from "@/lib/utils";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export default function BrowsePage() {
  const popularTokens = getPopularTokens(500);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-20">
      <header className="mb-12">
        <h1 className="text-heading-sm font-bold">Cari resep dari bahan</h1>
        <p className="mt-4 text-body">
          Punya ayam, bawang, dan cabai? Temukan resep yang bisa dibuat dari koleksi{" "}
          {RECIPE_COUNT_LABEL} resep masakan Indonesia.
        </p>
      </header>
      <BrowseClient popularTokens={popularTokens} />
    </div>
  );
}
