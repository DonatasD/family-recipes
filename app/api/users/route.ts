import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  forbidden,
  jsonError,
  readJson,
  unauthorized,
  validationError,
} from "@/lib/api";
import {
  generateApiToken,
  getApiUser,
  hashPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PERMISSIONS, can, normalizePermissions } from "@/lib/permissions";

export const runtime = "nodejs";

/** GET /api/users — everyone with an account and what they may do. */
export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  if (!can(user, "users:manage")) return forbidden("users:manage");

  const rows = await prisma.user.findMany({
    select: { id: true, email: true, name: true, permissions: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({
    users: rows.map((row) => ({
      ...row,
      permissions: normalizePermissions(row.permissions),
    })),
  });
}

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email(),
  /** Empty means "generate one and show it once", like the user:add script. */
  password: z.string().min(8).max(200).optional(),
  permissions: z.array(z.enum(PERMISSIONS)).default([]),
});

/** POST /api/users — create an account. Needs users:manage. */
export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  if (!can(user, "users:manage")) return forbidden("users:manage");

  const body = await readJson(request);
  if (body === null) return jsonError(400, "Body must be valid JSON");

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const { name, email, permissions } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return jsonError(409, "An account with that email already exists");

  const generated = parsed.data.password === undefined;
  const password = parsed.data.password ?? randomBytes(12).toString("base64url");

  const created = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      apiToken: generateApiToken(),
      permissions: normalizePermissions(permissions),
    },
    select: { id: true, email: true, name: true, permissions: true, createdAt: true },
  });

  // The generated password is returned exactly once; it is not stored in clear
  // anywhere, so the person adding the account must pass it on now.
  return NextResponse.json(
    {
      ...created,
      permissions: normalizePermissions(created.permissions),
      ...(generated ? { password } : {}),
    },
    { status: 201 }
  );
}
