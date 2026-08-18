import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";

import { getApiUser } from "@/lib/auth";
import { jsonError, readJson, unauthorized, validationError } from "@/lib/api";
import { prisma } from "@/lib/db";
import {
  recipeCreateSchema,
  recipeInclude,
  serializeRecipe,
  uniqueSlug,
} from "@/lib/recipes";

export const runtime = "nodejs";

/** GET /api/recipes?q=&tag=&limit=&offset= */
export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const params = new URL(request.url).searchParams;
  const q = params.get("q")?.trim();
  const tag = params.get("tag")?.trim().toLowerCase();
  const limit = Math.min(Math.max(Number(params.get("limit") ?? 50), 1), 100);
  const offset = Math.max(Number(params.get("offset") ?? 0), 0);

  const where: Prisma.RecipeWhereInput = {};
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { notes: { contains: q, mode: "insensitive" } },
      { tags: { has: q.toLowerCase() } },
    ];
  }
  if (tag) where.tags = { has: tag };

  const [rows, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      include: recipeInclude,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.recipe.count({ where }),
  ]);

  return NextResponse.json({
    total,
    limit,
    offset,
    recipes: rows.map(serializeRecipe),
  });
}

/** POST /api/recipes — upload a new recipe. */
export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const body = await readJson(request);
  if (body === null) return jsonError(400, "Body must be valid JSON");

  const parsed = recipeCreateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const data = parsed.data;
  const recipe = await prisma.recipe.create({
    data: {
      slug: await uniqueSlug(data.title),
      title: data.title,
      description: data.description ?? null,
      ingredients: data.ingredients,
      steps: data.steps,
      servings: data.servings ?? null,
      prepMinutes: data.prepMinutes ?? null,
      cookMinutes: data.cookMinutes ?? null,
      tags: data.tags ?? [],
      imageUrl: data.imageUrl ?? null,
      sourceName: data.sourceName ?? null,
      sourceUrl: data.sourceUrl ?? null,
      notes: data.notes ?? null,
      authorId: user.id,
    },
    include: recipeInclude,
  });

  return NextResponse.json(serializeRecipe(recipe), {
    status: 201,
    headers: { Location: `/recipes/${recipe.slug}` },
  });
}
