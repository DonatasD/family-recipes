"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteRecipeButton({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    const response = await fetch(`/api/recipes/${slug}`, { method: "DELETE" });
    if (!response.ok) {
      setBusy(false);
      setConfirming(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  // Two-step instead of a browser confirm() dialog.
  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-muted hover:text-accent"
      >
        Delete
      </button>
    );
  }

  return (
    <span className="flex items-center gap-3">
      <span className="text-muted">Delete “{title}”?</span>
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="rounded-lg bg-accent px-3 py-1 text-white disabled:opacity-50"
      >
        {busy ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-muted hover:text-ink"
      >
        Cancel
      </button>
    </span>
  );
}
