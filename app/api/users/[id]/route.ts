import { NextResponse } from "next/server";
import { z } from "zod";

import {
  forbidden,
  jsonError,
  notFound,
  readJson,
  unauthorized,
  validationError,
} from "@/lib/api";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PERMISSIONS, can, normalizePermissions } from "@/lib/permissions";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({ permissions: z.array(z.enum(PERMISSIONS)) });

/** PATCH /api/users/:id — replace someone's permissions. Needs users:manage. */
export async function PATCH(request: Request, { params }: Params) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  if (!can(user, "users:manage")) return forbidden("users:manage");

  const { id } = await params;
  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, permissions: true },
  });
  if (!target) return notFound("User");

  const body = await readJson(request);
  if (body === null) return jsonError(400, "Body must be valid JSON");

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const permissions = normalizePermissions(parsed.data.permissions);

  // Someone must always be able to manage people, otherwise the only way back
  // is the user:permissions script against the database.
  const losesManage =
    target.permissions.includes("users:manage") &&
    !permissions.includes("users:manage");
  if (losesManage) {
    const managers = await prisma.user.count({
      where: { permissions: { has: "users:manage" } },
    });
    if (managers <= 1) {
      return jsonError(
        409,
        "Give someone else the users:manage permission before taking it from the last person who has it"
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { permissions },
    select: { id: true, email: true, name: true, permissions: true, createdAt: true },
  });
  return NextResponse.json({
    ...updated,
    permissions: normalizePermissions(updated.permissions),
  });
}
