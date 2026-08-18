import { redirect } from "next/navigation";

import LoginForm from "@/components/LoginForm";
import { getSessionUser } from "@/lib/auth";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getSessionUser();
  if (user) redirect("/");

  const { next } = await searchParams;
  // Only same-site paths, so ?next= can't bounce you to another domain.
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <div className="mx-auto max-w-sm space-y-6 py-10">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-3xl">Welcome back</h1>
        <p className="text-sm text-muted">Our recipes are just for us two.</p>
      </div>
      <LoginForm next={target} />
    </div>
  );
}
