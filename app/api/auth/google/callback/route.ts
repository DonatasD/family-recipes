import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { isGoogleEmailAllowed, signInWithGoogle } from "@/lib/auth";
import {
  OAUTH_COOKIE,
  callbackUrl,
  exchangeCode,
  readOAuthState,
} from "@/lib/google";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";

export const runtime = "nodejs";

/** GET /api/auth/google/callback — Google sends the browser back here. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const cookieStore = await cookies();

  const saved = await readOAuthState(cookieStore.get(OAUTH_COOKIE)?.value ?? "");
  cookieStore.delete(OAUTH_COOKIE);

  const fail = (code: string) => {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", code);
    if (saved?.next && saved.next !== "/") url.searchParams.set("next", saved.next);
    return NextResponse.redirect(url);
  };

  if (params.get("error")) return fail("google_denied");

  const code = params.get("code");
  const state = params.get("state");
  if (!saved || !code || !state || state !== saved.state) return fail("google_state");

  const profile = await exchangeCode({
    code,
    redirectUri: callbackUrl(request),
    verifier: saved.verifier,
  });
  if (!profile) return fail("google_failed");
  if (!(await isGoogleEmailAllowed(profile.email))) return fail("not_allowed");

  const user = await signInWithGoogle(profile);
  cookieStore.set(SESSION_COOKIE, await signSession(user.id), sessionCookieOptions);

  return NextResponse.redirect(new URL(saved.next, request.url));
}
