import { NextResponse } from "next/server";

import { unauthorized } from "@/lib/api";
import { generateApiToken, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

/** POST /api/me/token — issue a fresh API token, invalidating the old one. */
export async function POST() {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { apiToken: generateApiToken() },
    select: { apiToken: true },
  });

  return NextResponse.json({ apiToken: updated.apiToken });
}
