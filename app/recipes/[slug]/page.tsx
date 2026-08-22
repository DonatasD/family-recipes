import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import DeleteRecipeButton from "@/components/DeleteRecipeButton";
import RatingControl from "@/components/RatingControl";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { recipeInclude, serializeRecipe } from "@/lib/recipes";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { slug },
    select: { title: true },
  });
  return { title: recipe ? recipe.title : "Recipe not found" };
}

export default async function RecipePage({ params }: Props) {
  const { slug } = await params;
  const user = await requireUser(`/recipes/${slug}`);

  const row = await prisma.recipe.findUnique({
    where: { slug },
    include: recipeInclude,
  });
  if (!row) notFound();

  const recipe = serializeRecipe(row);
  const myRating = recipe.ratings.find((rating) => rating.userId === user.id);

  return (
    <article className="space-y-8">
      <Link href="/" className="text-sm text-muted hover:text-accent">
        ← All recipes
      </Link>

      <header className="space-y-3">
        <h1 className="font-display text-4xl leading-tight">{recipe.title}</h1>

        {recipe.description && (
          <p className="max-w-2xl text-muted">{recipe.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
          {recipe.prepMinutes !== null && <span>Prep {recipe.prepMinutes} min</span>}
          {recipe.cookMinutes !== null && <span>Cook {recipe.cookMinutes} min</span>}
          {recipe.servings !== null && <span>Serves {recipe.servings}</span>}
          <span>Added by {recipe.author.name}</span>
        </div>

        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recipe.tags.map((tag) => (
              <Link
                key={tag}
                href={`/?tag=${encodeURIComponent(tag)}`}
                className="rounded-full bg-accent-soft px-3 py-1 text-xs text-accent hover:opacity-80"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </header>

      {recipe.imageUrl && (
        <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-line">
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            sizes="(max-width: 1024px) 100vw, 900px"
            className="object-cover"
            priority
          />
        </div>
      )}

      <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <section>
          <h2 className="font-display text-xl">Ingredients</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {recipe.ingredients.map((ingredient, index) => (
              <li
                key={index}
                className="flex gap-2 border-b border-line pb-2 last:border-0"
              >
                {(ingredient.amount || ingredient.unit) && (
                  <span className="shrink-0 font-medium">
                    {[ingredient.amount, ingredient.unit]
                      .filter(Boolean)
                      .join(" ")}
                  </span>
                )}
                <span className="text-muted">{ingredient.item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl">Method</h2>
          <ol className="mt-4 space-y-4">
            {recipe.steps.map((step, index) => (
              <li key={index} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display text-sm text-accent">
                  {index + 1}
                </span>
                <p className="pt-0.5 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {recipe.notes && (
        <section className="rounded-xl border border-line bg-card p-5">
          <h2 className="font-display text-lg">Notes</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
            {recipe.notes}
          </p>
        </section>
      )}

      <section className="space-y-4 border-t border-line pt-6">
        <h2 className="font-display text-lg">What we thought</h2>

        <RatingControl
          slug={recipe.slug}
          initialStars={myRating?.stars ?? null}
          initialFavorite={myRating?.favorite ?? false}
        />

        {recipe.ratings.filter((r) => r.userId !== user.id).length > 0 && (
          <ul className="space-y-1 text-sm text-muted">
            {recipe.ratings
              .filter((rating) => rating.userId !== user.id)
              .map((rating) => (
                <li key={rating.userId}>
                  {rating.userName}:{" "}
                  {rating.stars !== null && (
                    <span role="img" aria-label={`${rating.stars} of 5 stars`}>
                      {"★".repeat(rating.stars)}{" "}
                    </span>
                  )}
                  {rating.favorite ? "· favourite" : ""}
                </li>
              ))}
          </ul>
        )}
      </section>

      <footer className="flex flex-wrap items-center gap-4 border-t border-line pt-6 text-sm">
        {(recipe.sourceName || recipe.sourceUrl) && (
          <span className="text-muted">
            Source:{" "}
            {recipe.sourceUrl ? (
              <a
                href={recipe.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:underline"
              >
                {recipe.sourceName || recipe.sourceUrl}
              </a>
            ) : (
              recipe.sourceName
            )}
          </span>
        )}

        <div className="ml-auto flex items-center gap-4">
          <Link
            href={`/recipes/${recipe.slug}/edit`}
            className="rounded-lg border border-line px-4 py-2 hover:border-accent hover:text-accent"
          >
            Edit
          </Link>
          <DeleteRecipeButton slug={recipe.slug} title={recipe.title} />
        </div>
      </footer>
    </article>
  );
}
