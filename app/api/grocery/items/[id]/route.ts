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
import { getGroceryList, groceryItemUpdateSchema } from "@/lib/grocery-server";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** PATCH /api/grocery/items/:id — tick or untick a one-off item. */
export async function PATCH(request: Request, { params }: Params) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const { id } = await params;
  const item = await prisma.groceryItem.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!item) return notFound("Grocery item");

  const body = await readJson(request);
  if (body === null) return jsonError(400, "Body must be valid JSON");

  const parsed = groceryItemUpdateSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  await prisma.groceryItem.update({
    where: { id },
    data: { checked: parsed.data.checked },
  });
  return NextResponse.json(await getGroceryList());
}

/** DELETE /api/grocery/items/:id — remove a one-off item. */
export async function DELETE(request: Request, { params }: Params) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const { id } = await params;
  const deleted = await prisma.groceryItem.deleteMany({ where: { id } });
  if (deleted.count === 0) return notFound("Grocery item");

  return NextResponse.json(await getGroceryList());
}
