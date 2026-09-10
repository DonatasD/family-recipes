"use client";

import { useState, type FormEvent } from "react";

import type { AllowlistEntry } from "@/lib/google-allowlist";

/**
 * Which Google accounts may sign in. Entries from GOOGLE_ALLOWED_EMAILS are
 * shown locked; the rest are kept in the database and editable here.
 */
export default function GoogleAllowlistPanel({
  initialEmails,
  googleEnabled,
}: {
  initialEmails: AllowlistEntry[];
  googleEnabled: boolean;
}) {
  const [emails, setEmails] = useState(initialEmails);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function apply(response: Response, okMessage: string) {
    if (response.ok) {
      const body = (await response.json()) as { emails: AllowlistEntry[] };
      setEmails(body.emails);
      setMessage(okMessage);
    } else {
      const body = (await response.json().catch(() => null)) as
        | { error?: string; details?: Record<string, string> }
        | null;
      setMessage(body?.details?.email ?? body?.error ?? "Couldn't save that change.");
    }
  }

  async function add(event: FormEvent) {
    event.preventDefault();
    const email = draft.trim().toLowerCase();
    if (!email) return;
    setBusy(true);
    setMessage(null);
    await apply(
      await fetch("/api/google-allowlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }),
      `${email} can now sign in with Google.`
    );
    setDraft("");
    setBusy(false);
  }

  async function remove(email: string) {
    setBusy(true);
    setMessage(null);
    await apply(
      await fetch(`/api/google-allowlist/${encodeURIComponent(email)}`, {
        method: "DELETE",
      }),
      `${email} can no longer sign in with Google.`
    );
    setBusy(false);
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-xl">Google sign-in</h2>
        <p className="mt-1 text-sm text-muted">
          Google accounts on this list may sign in. One without an account yet
          gets a read-only account on first sign-in; grant it permissions above.
          {!googleEnabled &&
            " Sign in with Google is currently off because GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET aren't set."}
        </p>
      </div>

      {emails.length > 0 ? (
        <ul className="divide-y divide-line rounded-xl border border-line bg-card text-sm">
          {emails.map((entry) => (
            <li
              key={entry.email}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5"
            >
              <span className="min-w-0 flex-1 truncate">{entry.email}</span>
              {entry.locked ? (
                <span
                  className="text-xs text-muted"
                  title="Set in GOOGLE_ALLOWED_EMAILS; change it there"
                >
                  from environment
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => remove(entry.email)}
                  disabled={busy}
                  className="text-xs text-muted hover:text-danger disabled:opacity-50"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Nobody can sign in with Google yet.</p>
      )}

      <form onSubmit={add} className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <label className="label" htmlFor="allowlist-email">
            Google account
          </label>
          <input
            id="allowlist-email"
            type="email"
            required
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="someone@gmail.com"
            className="field"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg border border-line px-4 py-2 text-sm hover:border-accent hover:text-accent disabled:opacity-50"
        >
          Allow
        </button>
      </form>

      <p role="status" className="min-h-5 text-sm text-muted">
        {message}
      </p>
    </section>
  );
}
