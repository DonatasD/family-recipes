import { NextResponse } from "next/server";

import { jsonError, readJson, unauthorized, validationError } from "@/lib/api";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGroceryList, groceryItemCreateSchema } from "@/lib/grocery-server";

export const runtime = "nodejs";

/** POST /api/grocery/items — a one-off item that isn't from any recipe. */
export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const body = await readJson(request);
  if (body === null) return jsonError(400, "Body must be valid JSON");

  const parsed = groceryItemCreateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const { item, amount, unit, category } = parsed.data;
  await prisma.groceryItem.create({
    data: { item, amount, unit, category: category ?? null },
  });
  return NextResponse.json(await getGroceryList(), { status: 201 });
}
