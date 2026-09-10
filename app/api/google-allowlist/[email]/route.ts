import { NextResponse } from "next/server";

import { forbidden, jsonError, notFound, unauthorized } from "@/lib/api";
import { getApiUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { envAllowedEmails } from "@/lib/google";
import { listAllowedEmails } from "@/lib/google-allowlist";
import { can } from "@/lib/permissions";

export const runtime = "nodejs";

type Params = { params: Promise<{ email: string }> };

/** DELETE /api/google-allowlist/:email — stop a Google account signing in. */
export async function DELETE(request: Request, { params }: Params) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();
  if (!can(user, "users:manage")) return forbidden("users:manage");

  const email = decodeURIComponent((await params).email).trim().toLowerCase();
  if (envAllowedEmails().includes(email)) {
    return jsonError(
      409,
      "That address comes from GOOGLE_ALLOWED_EMAILS; remove it from the environment variable instead"
    );
  }

  const deleted = await prisma.googleAllowedEmail.deleteMany({ where: { email } });
  if (deleted.count === 0) return notFound("Allowed email");

  return NextResponse.json({ emails: await listAllowedEmails() });
}
