import { redirect } from "next/navigation";

import GoogleSignInButton from "@/components/GoogleSignInButton";
import LoginForm from "@/components/LoginForm";
import { getSessionUser } from "@/lib/auth";
import { isGoogleLoginEnabled } from "@/lib/google";

export const metadata = { title: "Sign in" };

const GOOGLE_ERRORS: Record<string, string> = {
  not_allowed: "That Google account isn't on the list. Try another one, or sign in with a password.",
  google_denied: "Google sign-in was cancelled.",
  google_state: "That sign-in link expired. Please try again.",
  google_failed: "Google didn't confirm who you are. Please try again.",
  google_off: "Google sign-in isn't set up on this site.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/");

  const { next, error } = await searchParams;
  // Only same-site paths, so ?next= can't bounce you to another domain.
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  const googleEnabled = isGoogleLoginEnabled();
  const message = error ? GOOGLE_ERRORS[error] : undefined;

  return (
    <div className="mx-auto max-w-sm space-y-6 py-10">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-3xl">Welcome back</h1>
        <p className="text-sm text-muted">Our recipes are just for us two.</p>
      </div>

      {message && (
        <p role="alert" className="text-center text-sm text-accent">
          {message}
        </p>
      )}

      {googleEnabled && (
        <>
          <GoogleSignInButton next={target} />
          <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <LoginForm next={target} />
    </div>
  );
}
