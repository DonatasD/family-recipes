import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";

import RecipeCard from "@/components/RecipeCard";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { recipeInclude, serializeRecipe } from "@/lib/recipes";

type SearchParams = Promise<{ q?: string; tag?: string }>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireUser("/");

  const { q, tag } = await searchParams;
  const query = q?.trim();
  const activeTag = tag?.trim().toLowerCase();

  const where: Prisma.RecipeWhereInput = {};
  if (query) {
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { notes: { contains: query, mode: "insensitive" } },
      { tags: { has: query.toLowerCase() } },
    ];
  }
  if (activeTag) where.tags = { has: activeTag };

  const [rows, allTagRows] = await Promise.all([
    prisma.recipe.findMany({
      where,
      include: recipeInclude,
      orderBy: { createdAt: "desc" },
    }),
    prisma.recipe.findMany({ select: { tags: true } }),
  ]);

  const recipes = rows.map(serializeRecipe);
  const tags = [...new Set(allTagRows.flatMap((row) => row.tags))].sort();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Our recipes</h1>
          <p className="mt-1 text-sm text-muted">
            {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
            {activeTag ? ` tagged “${activeTag}”` : ""}
            {query ? ` matching “${query}”` : ""}
          </p>
        </div>

        <form className="flex gap-2" action="/">
          {activeTag && <input type="hidden" name="tag" value={activeTag} />}
          <input
            type="search"
            name="q"
            defaultValue={query ?? ""}
            placeholder="Search recipes…"
            className="field w-56"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Search
          </button>
        </form>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <TagPill href={buildHref(query, undefined)} active={!activeTag}>
            All
          </TagPill>
          {tags.map((tag) => (
            <TagPill
              key={tag}
              href={buildHref(query, tag)}
              active={tag === activeTag}
            >
              {tag}
            </TagPill>
          ))}
        </div>
      )}

      {recipes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-10 text-center">
          <p className="font-display text-xl">Nothing here yet</p>
          <p className="mt-2 text-sm text-muted">
            {query || activeTag
              ? "No recipe matches that. Try a different search."
              : "Add your first recipe, or POST one to /api/recipes."}
          </p>
          <Link
            href="/recipes/new"
            className="mt-5 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Add a recipe
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}

function buildHref(q?: string, tag?: string) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (tag) params.set("tag", tag);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function TagPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1 text-xs ${
        active
          ? "border-accent bg-accent-soft text-accent"
          : "border-line text-muted hover:border-accent hover:text-accent"
      }`}
    >
      {children}
    </Link>
  );
}
