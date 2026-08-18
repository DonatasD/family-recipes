import Image from "next/image";
import Link from "next/link";

import type { SerializedRecipe } from "@/lib/recipes";

export default function RecipeCard({ recipe }: { recipe: SerializedRecipe }) {
  const favorited = recipe.ratings.some((rating) => rating.favorite);

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-card transition hover:border-accent"
    >
      <div className="relative aspect-[4/3] bg-accent-soft">
        {recipe.imageUrl ? (
          <Image
            src={recipe.imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-4xl text-accent opacity-40">
            {recipe.title.slice(0, 1).toUpperCase()}
          </div>
        )}
        {favorited && (
          <span
            className="absolute right-2 top-2 rounded-full bg-card/90 px-2 py-1 text-xs"
            title="A favourite"
          >
            ★
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="font-display text-lg leading-snug group-hover:text-accent">
          {recipe.title}
        </h2>

        {recipe.description && (
          <p className="line-clamp-2 text-sm text-muted">{recipe.description}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs text-muted">
          {recipe.totalMinutes !== null && <span>{recipe.totalMinutes} min</span>}
          {recipe.servings !== null && <span>Serves {recipe.servings}</span>}
          {recipe.averageStars !== null && (
            <span className="text-accent">★ {recipe.averageStars}</span>
          )}
        </div>

        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] text-accent"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
