import { GeneratorForm } from "@/components/GeneratorForm";
import { getPopularTokens } from "@/lib/recipes";
import { RECIPE_COUNT_LABEL } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function HomePage() {
  const popularTokens = getPopularTokens(500);

  return (
    <div className="page-container">
      <section className="mb-10 grid gap-8 md:mb-16 md:grid-cols-2 md:items-center md:gap-12">
        <div>
          <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-4xl md:mb-6 md:text-[56px]">
            Menu masakan mingguan, tanpa pusing
          </h1>
          <p className="text-base leading-relaxed md:text-body">
            Jelajahi {RECIPE_COUNT_LABEL} resep masakan Indonesia. Generate menu 1–7 hari,
            filter dari bahan yang ada, dan cetak kartu lucu dengan QR code ke detail resep.
          </p>
          <p className="mt-4 inline-block border border-ink-violet bg-butter-yellow px-3 py-1.5 text-xs font-bold sm:text-sm">
            {RECIPE_COUNT_LABEL} resep tersedia
          </p>
        </div>
        <div className="border border-ink-violet bg-pure-white p-6 md:hidden">
          <div className="space-y-3 font-mono text-sm">
            <p>▢ Pilih durasi & jumlah resep</p>
            <p>▢ Tag bahan (opsional)</p>
            <p>▢ Generate → Cetak + QR</p>
          </div>
        </div>
        <div className="hidden border border-ink-violet bg-pure-white p-10 md:block">
          <div className="space-y-4 font-mono text-sm">
            <p>▢ Pilih durasi & jumlah resep</p>
            <p>▢ Tag bahan (opsional)</p>
            <p>▢ Generate → Cetak + QR</p>
          </div>
        </div>
      </section>

      <GeneratorForm popularTokens={popularTokens} />
    </div>
  );
}
