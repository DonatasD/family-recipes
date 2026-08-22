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
import {
  getGroceryList,
  groceryRecipeUpdateSchema,
} from "@/lib/grocery-server";

export const runtime = "nodejs";

type Params = { params: Promise<{ idOrSlug: string }> };

async function findEntry(idOrSlug: string) {
  return prisma.groceryRecipe.findFirst({
    where: { recipe: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] } },
    select: { id: true },
  });
}

/** PATCH /api/grocery/recipes/:idOrSlug — change servings or tick items. */
export async function PATCH(request: Request, { params }: Params) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const entry = await findEntry((await params).idOrSlug);
  if (!entry) return notFound("Recipe on the grocery list");

  const body = await readJson(request);
  if (body === null) return jsonError(400, "Body must be valid JSON");

  const parsed = groceryRecipeUpdateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { servings, checked } = parsed.data;
  await prisma.groceryRecipe.update({
    where: { id: entry.id },
    data: {
      ...(servings !== undefined ? { servings } : {}),
      ...(checked !== undefined ? { checked } : {}),
    },
  });
  return NextResponse.json(await getGroceryList());
}

/** DELETE /api/grocery/recipes/:idOrSlug — take the recipe off the list. */
export async function DELETE(request: Request, { params }: Params) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const entry = await findEntry((await params).idOrSlug);
  if (!entry) return notFound("Recipe on the grocery list");

  await prisma.groceryRecipe.delete({ where: { id: entry.id } });
  return NextResponse.json(await getGroceryList());
}
