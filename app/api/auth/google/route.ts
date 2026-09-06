import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  OAUTH_COOKIE,
  authorizationUrl,
  callbackUrl,
  createOAuthState,
  isGoogleLoginEnabled,
  oauthCookieOptions,
} from "@/lib/google";

export const runtime = "nodejs";

/** GET /api/auth/google?next=/path — send the browser to Google's consent screen. */
export async function GET(request: Request) {
  if (!isGoogleLoginEnabled()) {
    return NextResponse.redirect(new URL("/login?error=google_off", request.url));
  }

  const next = new URL(request.url).searchParams.get("next") ?? "/";
  // Only same-site paths, so ?next= can't bounce you to another domain.
  const target = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  const { state, verifier, cookie } = await createOAuthState(target);
  (await cookies()).set(OAUTH_COOKIE, cookie, oauthCookieOptions);

  return NextResponse.redirect(
    authorizationUrl({ redirectUri: callbackUrl(request), state, verifier })
  );
}
