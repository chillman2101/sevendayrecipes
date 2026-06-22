import { notFound } from "next/navigation";
import { RecipeBackLink } from "@/components/RecipeBackLink";
import { getRecipeById } from "@/lib/recipes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function RecipePage({ params }: Props) {
  const { id } = await params;
  const recipe = getRecipeById(id);
  if (!recipe) notFound();

  return (
    <div className="page-container max-w-[800px]">
      <RecipeBackLink />

      <article className="card space-y-8 md:space-y-10">
        <header>
          <h1 className="text-2xl font-bold leading-snug sm:text-3xl md:text-heading-sm">{recipe.title}</h1>
          <p className="mt-3 text-sm md:mt-4 md:text-body-sm">
            {recipe.num_ingredients} bahan · {recipe.num_steps} langkah
          </p>
        </header>

        <section>
          <h2 className="mb-3 text-xl font-bold md:mb-4 md:text-subheading">Bahan-bahan</h2>
          <ul className="list-inside list-disc space-y-2 text-sm md:text-base">
            {recipe.ingredients.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold md:mb-4 md:text-subheading">Cara membuat</h2>
          <ol className="list-inside list-decimal space-y-3 text-sm md:space-y-4 md:text-base">
            {recipe.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </section>
      </article>
    </div>
  );
}
