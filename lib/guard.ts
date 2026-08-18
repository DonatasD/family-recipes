import { redirect } from "next/navigation";

import { getSessionUser, type AuthUser } from "@/lib/auth";

/** For server components: the signed-in user, or a redirect to /login. */
export async function requireUser(returnTo?: string): Promise<AuthUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect(returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login");
  }
  return user;
}
