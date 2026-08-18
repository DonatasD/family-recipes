import { NextResponse } from "next/server";
import { z } from "zod";

import { getApiUser } from "@/lib/auth";
import {
  jsonError,
  notFound,
  readJson,
  unauthorized,
  validationError,
} from "@/lib/api";
import { prisma } from "@/lib/db";
import { recipeInclude, serializeRecipe } from "@/lib/recipes";

export const runtime = "nodejs";

type Params = { params: Promise<{ idOrSlug: string }> };

const ratingSchema = z
  .object({
    stars: z.number().int().min(1).max(5).optional(),
    favorite: z.boolean().optional(),
  })
  .refine((data) => data.stars !== undefined || data.favorite !== undefined, {
    message: "Provide `stars` (1-5) and/or `favorite`",
  });

/** PUT /api/recipes/:idOrSlug/rating — your own rating, one per person. */
export async function PUT(request: Request, { params }: Params) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const idOrSlug = (await params).idOrSlug;
  const recipe = await prisma.recipe.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    select: { id: true },
  });
  if (!recipe) return notFound();

  const body = await readJson(request);
  if (body === null) return jsonError(400, "Body must be valid JSON");

  const parsed = ratingSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { stars, favorite } = parsed.data;
  await prisma.rating.upsert({
    where: { userId_recipeId: { userId: user.id, recipeId: recipe.id } },
    create: {
      userId: user.id,
      recipeId: recipe.id,
      stars: stars ?? null,
      favorite: favorite ?? false,
    },
    update: {
      ...(stars !== undefined ? { stars } : {}),
      ...(favorite !== undefined ? { favorite } : {}),
    },
  });

  const updated = await prisma.recipe.findUniqueOrThrow({
    where: { id: recipe.id },
    include: recipeInclude,
  });
  return NextResponse.json(serializeRecipe(updated));
}

/** DELETE /api/recipes/:idOrSlug/rating — remove your rating. */
export async function DELETE(request: Request, { params }: Params) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const idOrSlug = (await params).idOrSlug;
  const recipe = await prisma.recipe.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    select: { id: true },
  });
  if (!recipe) return notFound();

  await prisma.rating.deleteMany({
    where: { userId: user.id, recipeId: recipe.id },
  });
  return new NextResponse(null, { status: 204 });
}
