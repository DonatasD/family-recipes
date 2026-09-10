import "server-only";

import { randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/db";
import { envAllowedEmails } from "@/lib/google";
import { normalizePermissions, type Permission } from "@/lib/permissions";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  permissions: Permission[];
};

const USER_FIELDS = {
  id: true,
  email: true,
  name: true,
  permissions: true,
} as const;

type UserRow = {
  id: string;
  email: string;
  name: string;
  permissions: string[];
};

/** The column is a plain text[]; drop anything the code no longer recognises. */
function toAuthUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    permissions: normalizePermissions(row.permissions),
  };
}

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

/** Resolves a personal API token to its owner. Shared by REST and MCP auth. */
export async function getUserByApiToken(token: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { apiToken: token },
    select: { ...USER_FIELDS, apiToken: true },
  });
  if (!user || !tokensMatch(user.apiToken, token)) return null;

  return toAuthUser(user);
}

async function userFromBearer(request: Request): Promise<AuthUser | null> {
  const token = extractBearer(request);
  if (!token) return null;
  return getUserByApiToken(token);
}

/** The signed-in user for a browser request, or null. */
export async function getSessionUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const userId = await verifySession(token);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: USER_FIELDS,
  });
  return user ? toAuthUser(user) : null;
}

/**
 * Resolves the caller of an API route: a bearer API token if present,
 * otherwise the browser session cookie. Returns null when neither is valid.
 */
export async function getApiUser(request: Request): Promise<AuthUser | null> {
  return (await userFromBearer(request)) ?? (await getSessionUser());
}

/**
 * A Google account may sign in when it is either in GOOGLE_ALLOWED_EMAILS or
 * was added on the Users page. Having a password account is deliberately not
 * enough on its own.
 */
export async function isGoogleEmailAllowed(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (envAllowedEmails().includes(normalized)) return true;
  const row = await prisma.googleAllowedEmail.findUnique({
    where: { email: normalized },
    select: { email: true },
  });
  return row !== null;
}

/**
 * Signs in an allow-listed Google account. An existing account with the same
 * email is simply used (its name, permissions and API token stay as they
 * are); otherwise one is created with no password — Google is its only way in
 * until `user:add` sets one. The allowlist decides who gets in; permissions
 * decide what they can do, so a brand-new account starts read-only until
 * someone grants it more under Settings.
 */
export async function signInWithGoogle(profile: {
  email: string;
  name: string;
}): Promise<AuthUser> {
  const email = profile.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email }, select: USER_FIELDS });
  if (existing) return toAuthUser(existing);

  const created = await prisma.user.create({
    data: {
      email,
      name: profile.name,
      apiToken: generateApiToken(),
      permissions: [],
    },
    select: USER_FIELDS,
  });
  return toAuthUser(created);
}
