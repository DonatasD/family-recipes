import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";

import RecipeBrowser from "@/components/RecipeBrowser";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { can } from "@/lib/permissions";
import { recipeInclude, serializeRecipe } from "@/lib/recipes";

type SearchParams = Promise<{ tag?: string }>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser("/");

  const { tag } = await searchParams;
  const activeTag = tag?.trim().toLowerCase();

  const where: Prisma.RecipeWhereInput = {};
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
    <RecipeBrowser
      recipes={recipes}
      activeTag={activeTag}
      canCreate={can(user, "recipes:create")}
      tagPills={
        tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <TagPill href="/" active={!activeTag}>
              All
            </TagPill>
            {tags.map((tag) => (
              <TagPill
                key={tag}
                href={`/?tag=${encodeURIComponent(tag)}`}
                active={tag === activeTag}
              >
                {tag}
              </TagPill>
            ))}
          </div>
        )
      }
    />
  );
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
      aria-current={active ? "page" : undefined}
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
