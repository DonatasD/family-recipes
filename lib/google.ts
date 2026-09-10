import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { SignJWT, createRemoteJWKSet, jwtVerify } from "jose";

/**
 * Sign in with Google, done directly against Google's OAuth 2.0 / OpenID
 * Connect endpoints. There are only two accounts here, so the extra
 * dependency (and database tables) of an auth library isn't worth it.
 */

export const OAUTH_COOKIE = "recipes_oauth";
const OAUTH_TTL_SECONDS = 10 * 60;

const AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

function clientId() {
  return process.env.GOOGLE_CLIENT_ID?.trim() || null;
}

function clientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET?.trim() || null;
}

/** The Google button only shows once both OAuth credentials are configured. */
export function isGoogleLoginEnabled(): boolean {
  return Boolean(clientId() && clientSecret());
}

/**
 * Google accounts allowed in by configuration, from GOOGLE_ALLOWED_EMAILS
 * (comma-separated). The Users page adds more in the database — see
 * `isGoogleEmailAllowed` in lib/auth.ts, which checks both. Unset means
 * nobody from the environment: this is a private site, so the failure mode is
 * "locked out", never "open to any Google account".
 */
export function envAllowedEmails(): string[] {
  return (process.env.GOOGLE_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(value);
}

type OAuthState = { state: string; verifier: string; next: string };

/**
 * The round-trip cookie: a signed JWT carrying the CSRF state, the PKCE
 * verifier and where to land afterwards, so nothing has to be stored
 * server-side between the redirect out and the callback.
 */
export async function createOAuthState(next: string) {
  const state = randomBytes(16).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const cookie = await new SignJWT({ state, verifier, next } satisfies OAuthState)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${OAUTH_TTL_SECONDS}s`)
    .sign(secret());
  return { state, verifier, cookie };
}

export async function readOAuthState(cookie: string): Promise<OAuthState | null> {
  try {
    const { payload } = await jwtVerify(cookie, secret());
    const { state, verifier, next } = payload as Partial<OAuthState>;
    if (typeof state !== "string" || typeof verifier !== "string") return null;
    return { state, verifier, next: typeof next === "string" ? next : "/" };
  } catch {
    return null;
  }
}

export const oauthCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: OAUTH_TTL_SECONDS,
} as const;

export function authorizationUrl(opts: {
  redirectUri: string;
  state: string;
  verifier: string;
}): string {
  const id = clientId();
  if (!id) throw new Error("GOOGLE_CLIENT_ID is not set");

  const challenge = createHash("sha256").update(opts.verifier).digest("base64url");
  const url = new URL(AUTHORIZATION_ENDPOINT);
  url.search = new URLSearchParams({
    client_id: id,
    redirect_uri: opts.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state: opts.state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    // Always offer the account chooser: the wrong Google account being
    // signed in is the most likely reason for a "not allowed" bounce.
    prompt: "select_account",
  }).toString();
  return url.toString();
}

export type GoogleProfile = { email: string; name: string };

/**
 * Exchanges the authorization code and verifies the returned ID token against
 * Google's published keys. Only verified emails count — an unverified one
 * would let anyone claim an allow-listed address.
 */
export async function exchangeCode(opts: {
  code: string;
  redirectUri: string;
  verifier: string;
}): Promise<GoogleProfile | null> {
  const id = clientId();
  const secretValue = clientSecret();
  if (!id || !secretValue) return null;

  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: opts.code,
      client_id: id,
      client_secret: secretValue,
      redirect_uri: opts.redirectUri,
      grant_type: "authorization_code",
      code_verifier: opts.verifier,
    }),
  });
  if (!response.ok) return null;

  const tokens = (await response.json()) as { id_token?: string };
  if (!tokens.id_token) return null;

  try {
    const { payload } = await jwtVerify(tokens.id_token, JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: id,
    });
    if (typeof payload.email !== "string" || payload.email_verified !== true) {
      return null;
    }
    const name =
      typeof payload.name === "string" && payload.name.trim()
        ? payload.name.trim()
        : payload.email.split("@")[0];
    return { email: payload.email.toLowerCase(), name };
  } catch {
    return null;
  }
}

/** Absolute origin of the current request, so one deploy serves every hostname. */
export function requestOrigin(request: Request): string {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "localhost:3000";
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function callbackUrl(request: Request): string {
  return `${requestOrigin(request)}/api/auth/google/callback`;
}
