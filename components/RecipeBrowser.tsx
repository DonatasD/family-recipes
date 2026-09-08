"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import RecipeCard from "@/components/RecipeCard";
import type { SerializedRecipe } from "@/lib/recipes";

const DEBOUNCE_MS = 350;

/** Case- and accent-insensitive, so "salti" finds "Šaltibarščiai". */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function matches(recipe: SerializedRecipe, needle: string): boolean {
  return [
    recipe.title,
    recipe.description ?? "",
    recipe.notes ?? "",
    ...recipe.tags,
  ].some((text) => fold(text).includes(needle));
}

/**
 * The recipe list with search-as-you-type. Filtering happens in the browser
 * over the recipes the page already loaded, so the URL never carries the
 * query; tag filtering stays server-side via the pills passed in.
 */
export default function RecipeBrowser({
  recipes,
  activeTag,
  tagPills,
}: {
  recipes: SerializedRecipe[];
  activeTag?: string;
  tagPills: React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const needle = fold(debounced.trim());
  const shown = needle
    ? recipes.filter((recipe) => matches(recipe, needle))
    : recipes;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Our recipes</h1>
          <p className="mt-1 text-sm text-muted" aria-live="polite">
            {shown.length} {shown.length === 1 ? "recipe" : "recipes"}
            {activeTag ? ` tagged “${activeTag}”` : ""}
            {needle ? ` matching “${debounced.trim()}”` : ""}
          </p>
        </div>

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search recipes…"
          aria-label="Search recipes"
          className="field sm:w-64"
        />
      </div>

      {tagPills}

      {shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-10 text-center">
          <p className="font-display text-xl">Nothing here yet</p>
          <p className="mt-2 text-sm text-muted">
            {needle || activeTag
              ? "No recipe matches that. Try a different search."
              : "Add your first recipe, or POST one to /api/recipes."}
          </p>
          {!needle && !activeTag && (
            <Link
              href="/recipes/new"
              className="mt-5 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Add a recipe
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
