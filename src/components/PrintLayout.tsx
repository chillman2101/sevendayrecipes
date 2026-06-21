import QRCode from "qrcode";
import type { Plan, Recipe } from "@/types";
import { DAY_LABELS, formatPlanDate, getBaseUrl } from "@/lib/utils";

type Props = {
  plan: Plan;
  recipes: Recipe[];
};

async function makeQr(url: string): Promise<string> {
  return QRCode.toDataURL(url, { margin: 1, width: 120 });
}

export async function PrintLayout({ plan, recipes }: Props) {
  const baseUrl = getBaseUrl();
  const recipeMap = new Map(recipes.map((r) => [r.id, r]));

  const grouped = Array.from({ length: plan.config.days }, (_, i) => {
    const day = i + 1;
    return {
      day,
      label: DAY_LABELS[i] ?? `Hari ${day}`,
      slots: plan.slots.filter((s) => s.day === day),
    };
  });

  const qrEntries = await Promise.all(
    plan.slots.map(async (slot) => ({
      key: `${slot.day}-${slot.slot}`,
      dataUrl: await makeQr(`${baseUrl}/recipe/${slot.recipeId}`),
    }))
  );
  const qrMap = new Map(qrEntries.map((e) => [e.key, e.dataUrl]));

  return (
    <div className="print-root mx-auto max-w-[900px] bg-cream-paper p-4 text-ink-violet sm:p-8">
      <header className="mb-8 border-b-2 border-ink-violet pb-4 text-center sm:mb-10 sm:pb-6">
        <p className="mb-2 text-xs uppercase tracking-widest sm:text-sm">SevenDay Recipes</p>
        <h1 className="text-2xl font-bold sm:text-4xl">Menu Minggu Ini</h1>
        <p className="mt-2 text-base">{formatPlanDate(plan.createdAt)}</p>
      </header>

      {grouped.map(({ day, label, slots }) => (
        <section key={day} className="mb-10 break-inside-avoid">
          <h2 className="mb-4 border border-ink-violet bg-butter-yellow px-4 py-2 text-xl font-bold">
            Hari {day} — {label}
          </h2>
          <div className="grid gap-4">
            {slots.map((slot) => {
              const recipe = recipeMap.get(slot.recipeId);
              if (!recipe) return null;
              const qr = qrMap.get(`${slot.day}-${slot.slot}`);
              return (
                <article
                  key={`${day}-${slot.slot}`}
                  className="flex flex-col gap-3 border border-ink-violet bg-pure-white p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs uppercase">Resep {slot.slot}</p>
                    <h3 className="text-lg font-bold leading-tight sm:text-2xl">{recipe.title}</h3>
                    <p className="mt-2 text-sm">Scan QR untuk bahan & langkah</p>
                  </div>
                  {qr && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qr} alt={`QR ${recipe.title}`} width={96} height={96} className="self-start sm:self-center" />
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ))}

      <footer className="mt-8 border-t border-ink-violet pt-4 text-center text-sm">
        Scan QR untuk melihat detail resep di SevenDay Recipes
      </footer>
    </div>
  );
}
