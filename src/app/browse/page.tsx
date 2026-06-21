import { BrowseClient } from "@/components/BrowseClient";
import { getPopularTokens } from "@/lib/recipes";
import { RECIPE_COUNT_LABEL } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function BrowsePage() {
  const popularTokens = getPopularTokens(500);

  return (
    <div className="page-container">
      <header className="mb-8 md:mb-12">
        <h1 className="text-2xl font-bold sm:text-3xl md:text-heading-sm">Cari resep</h1>
        <p className="mt-3 text-base leading-relaxed md:mt-4 md:text-body">
          Cari dari nama menu atau dari bahan yang ada — dari koleksi {RECIPE_COUNT_LABEL} resep
          masakan Indonesia.
        </p>
      </header>
      <BrowseClient popularTokens={popularTokens} />
    </div>
  );
}
