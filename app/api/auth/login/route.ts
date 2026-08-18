import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonError, readJson, validationError } from "@/lib/api";
import { verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await readJson(request);
  if (body === null) return jsonError(400, "Body must be valid JSON");

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  // Same response either way, so this can't be used to enumerate accounts.
  const ok = user
    ? await verifyPassword(parsed.data.password, user.passwordHash)
    : false;
  if (!user || !ok) return jsonError(401, "Wrong email or password");

  (await cookies()).set(
    SESSION_COOKIE,
    await signSession(user.id),
    sessionCookieOptions
  );

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
}
