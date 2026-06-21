import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipeById } from "@/lib/recipes";

export const runtime = "nodejs";

type Props = { params: Promise<{ id: string }> };

export default async function RecipePage({ params }: Props) {
  const { id } = await params;
  const recipe = getRecipeById(id);
  if (!recipe) notFound();

  return (
    <div className="mx-auto max-w-[800px] px-6 py-16 md:px-20">
      <Link href="/" className="no-print mb-8 inline-block text-body-sm hover:underline">
        ← Kembali
      </Link>

      <article className="card space-y-10">
        <header>
          <h1 className="text-heading-sm font-bold">{recipe.title}</h1>
          <p className="mt-4 text-body-sm">
            {recipe.num_ingredients} bahan · {recipe.num_steps} langkah
          </p>
        </header>

        <section>
          <h2 className="mb-4 text-subheading font-bold">Bahan-bahan</h2>
          <ul className="list-inside list-disc space-y-2">
            {recipe.ingredients.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-subheading font-bold">Cara membuat</h2>
          <ol className="list-inside list-decimal space-y-4">
            {recipe.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>
      </article>
    </div>
  );
}
