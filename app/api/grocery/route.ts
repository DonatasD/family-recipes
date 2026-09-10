import { NextResponse } from "next/server";
import { z } from "zod";

import {
  forbidden,
  jsonError,
  readJson,
  unauthorized,
  validationError,
} from "@/lib/api";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/permissions";
import { getGroceryList } from "@/lib/grocery-server";

export const runtime = "nodejs";

/** GET /api/grocery — the shared grocery list. */
export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  if (!can(user, "grocery")) return forbidden("grocery");

  return NextResponse.json(await getGroceryList());
}

/** The only bulk edit so far: `{ "checked": false }` unticks everything. */
const bulkSchema = z.object({ checked: z.literal(false) });

/** PATCH /api/grocery — start the shopping round over. */
export async function PATCH(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  if (!can(user, "grocery")) return forbidden("grocery");

  const body = await readJson(request);
  if (body === null) return jsonError(400, "Body must be valid JSON");

  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  await prisma.$transaction([
    prisma.groceryRecipe.updateMany({ data: { checked: [] } }),
    prisma.groceryItem.updateMany({ data: { checked: false } }),
  ]);
  return NextResponse.json(await getGroceryList());
}

/** DELETE /api/grocery — clear the list entirely. */
export async function DELETE(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  if (!can(user, "grocery")) return forbidden("grocery");

  await prisma.$transaction([
    prisma.groceryRecipe.deleteMany(),
    prisma.groceryItem.deleteMany(),
  ]);
  return NextResponse.json(await getGroceryList());
}
