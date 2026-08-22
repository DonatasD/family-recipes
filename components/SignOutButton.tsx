"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    startTransition(() => {
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      // ink at 80%, not muted: muted misses AA on the header's soft green
      className="text-ink/80 hover:text-accent disabled:opacity-50"
    >
      Sign out
    </button>
  );
}
