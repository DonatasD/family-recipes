import { NextResponse } from "next/server";

import {
  jsonError,
  notFound,
  readJson,
  unauthorized,
  validationError,
} from "@/lib/api";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGroceryList, groceryRecipeAddSchema } from "@/lib/grocery-server";

export const runtime = "nodejs";

/** POST /api/grocery/recipes — put a recipe (by id or slug) on the list. */
export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const body = await readJson(request);
  if (body === null) return jsonError(400, "Body must be valid JSON");

  const parsed = groceryRecipeAddSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { recipe: idOrSlug, servings } = parsed.data;
  const recipe = await prisma.recipe.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    select: { id: true },
  });
  if (!recipe) return notFound();

  // Re-adding a recipe already on the list just updates its servings.
  await prisma.groceryRecipe.upsert({
    where: { recipeId: recipe.id },
    create: { recipeId: recipe.id, servings: servings ?? null },
    update: servings !== undefined ? { servings } : {},
  });
  return NextResponse.json(await getGroceryList(), { status: 201 });
}
