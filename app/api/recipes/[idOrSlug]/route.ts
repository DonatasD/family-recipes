import { NextResponse } from "next/server";

import { getApiUser } from "@/lib/auth";
import {
  jsonError,
  notFound,
  readJson,
  unauthorized,
  validationError,
} from "@/lib/api";
import { prisma } from "@/lib/db";
import {
  recipeInclude,
  recipeUpdateSchema,
  serializeRecipe,
  uniqueSlug,
} from "@/lib/recipes";

export const runtime = "nodejs";

type Params = { params: Promise<{ idOrSlug: string }> };

/** Recipes are addressable by either their id or their slug. */
async function findRecipe(idOrSlug: string) {
  return prisma.recipe.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    include: recipeInclude,
  });
}

export async function GET(request: Request, { params }: Params) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const recipe = await findRecipe((await params).idOrSlug);
  if (!recipe) return notFound();

  return NextResponse.json(serializeRecipe(recipe));
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const existing = await findRecipe((await params).idOrSlug);
  if (!existing) return notFound();

  const body = await readJson(request);
  if (body === null) return jsonError(400, "Body must be valid JSON");

  const parsed = recipeUpdateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const data = parsed.data;
  const updated = await prisma.recipe.update({
    where: { id: existing.id },
    data: {
      ...data,
      // Keep the slug in step with the title, but never break an existing link
      // for an unrelated edit.
      ...(data.title && data.title !== existing.title
        ? { slug: await uniqueSlug(data.title, existing.id) }
        : {}),
    },
    include: recipeInclude,
  });

  return NextResponse.json(serializeRecipe(updated));
}

export async function DELETE(request: Request, { params }: Params) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const existing = await findRecipe((await params).idOrSlug);
  if (!existing) return notFound();

  await prisma.recipe.delete({ where: { id: existing.id } });
  return new NextResponse(null, { status: 204 });
}
