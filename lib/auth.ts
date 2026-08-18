import "server-only";

import { randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

const USER_FIELDS = { id: true, email: true, name: true } as const;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Personal API tokens are shown once in Settings and used as a bearer token. */
export function generateApiToken(): string {
  return `rcp_${randomBytes(24).toString("base64url")}`;
}

function extractBearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const [scheme, ...rest] = header.split(" ");
  if (scheme.toLowerCase() !== "bearer") return null;
  const token = rest.join(" ").trim();
  return token.length > 0 ? token : null;
}

/** Constant-time compare so token lookups don't leak length/prefix timing. */
function tokensMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

async function userFromBearer(request: Request): Promise<AuthUser | null> {
  const token = extractBearer(request);
  if (!token) return null;

  const user = await prisma.user.findUnique({
    where: { apiToken: token },
    select: { ...USER_FIELDS, apiToken: true },
  });
  if (!user || !tokensMatch(user.apiToken, token)) return null;

  return { id: user.id, email: user.email, name: user.name };
}

/** The signed-in user for a browser request, or null. */
export async function getSessionUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const userId = await verifySession(token);
  if (!userId) return null;

  return prisma.user.findUnique({ where: { id: userId }, select: USER_FIELDS });
}

/**
 * Resolves the caller of an API route: a bearer API token if present,
 * otherwise the browser session cookie. Returns null when neither is valid.
 */
export async function getApiUser(request: Request): Promise<AuthUser | null> {
  return (await userFromBearer(request)) ?? (await getSessionUser());
}
