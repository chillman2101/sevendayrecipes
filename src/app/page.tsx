import { GeneratorForm } from "@/components/GeneratorForm";
import { getPopularTokens } from "@/lib/recipes";
import { RECIPE_COUNT_LABEL } from "@/lib/utils";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const popularTokens = getPopularTokens(500);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-16 md:px-20 md:py-24">
      <section className="mb-16 grid gap-12 md:grid-cols-2 md:items-center">
        <div>
          <h1 className="mb-6 text-display font-bold leading-tight md:text-[56px]">
            Menu masakan mingguan, tanpa pusing
          </h1>
          <p className="text-body">
            Jelajahi {RECIPE_COUNT_LABEL} resep masakan Indonesia. Generate menu 1–7 hari,
            filter dari bahan yang ada, dan cetak kartu lucu dengan QR code ke detail resep.
          </p>
          <p className="mt-4 inline-block border border-ink-violet bg-butter-yellow px-4 py-2 text-sm font-bold">
            {RECIPE_COUNT_LABEL} resep tersedia
          </p>
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
