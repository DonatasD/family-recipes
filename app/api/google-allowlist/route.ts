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
import { listAllowedEmails } from "@/lib/google-allowlist";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";

/** GET /api/google-allowlist — who may sign in with Google. Needs users:manage. */
export async function GET(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  if (!can(user, "users:manage")) return forbidden("users:manage");

  return NextResponse.json({ emails: await listAllowedEmails() });
}

const addSchema = z.object({ email: z.string().trim().toLowerCase().email() });

/** POST /api/google-allowlist — allow a Google account in. */
export async function POST(request: Request) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  if (!can(user, "users:manage")) return forbidden("users:manage");

  const body = await readJson(request);
  if (body === null) return jsonError(400, "Body must be valid JSON");

  const parsed = addSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);

  // Re-adding is harmless; the list is a set.
  await prisma.googleAllowedEmail.upsert({
    where: { email: parsed.data.email },
    create: { email: parsed.data.email },
    update: {},
  });
  return NextResponse.json({ emails: await listAllowedEmails() }, { status: 201 });
}
