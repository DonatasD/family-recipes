"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function SignOutButton({ className }: { className?: string }) {
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
      className={`disabled:opacity-50 ${className ?? ""}`}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
