"use client";

import { useState, type FormEvent } from "react";

import type { Person } from "@/components/PeoplePanel";
import {
  DEFAULT_PERMISSIONS,
  PERMISSIONS,
  PERMISSION_LABELS,
  type Permission,
} from "@/lib/permissions";

type Created = Person & { password?: string };

/**
 * Creates an account the way `user:add` does. A generated password is shown
 * once; it isn't kept in clear anywhere, so it has to be passed on now.
 */
export default function NewUserForm({
  onCreated,
}: {
  onCreated: (person: Person) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>([
    ...DEFAULT_PERMISSIONS,
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);

  function togglePermission(permission: Permission, granted: boolean) {
    setPermissions((current) =>
      granted
        ? [...current, permission]
        : current.filter((p) => p !== permission)
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setCreated(null);

    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        permissions,
        ...(password ? { password } : {}),
      }),
    });

    if (response.ok) {
      const person = (await response.json()) as Created;
      setCreated(person);
      onCreated(person);
      setName("");
      setEmail("");
      setPassword("");
      setPermissions([...DEFAULT_PERMISSIONS]);
    } else {
      const body = (await response.json().catch(() => null)) as
        | { error?: string; details?: Record<string, string> }
        | null;
      setError(
        body?.details ? Object.values(body.details).join(" ") : body?.error ?? "Couldn't create the account."
      );
    }
    setBusy(false);
  }

  async function copyPassword() {
    if (!created?.password) return;
    await navigator.clipboard.writeText(created.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-xl">New user</h2>
        <p className="mt-1 text-sm text-muted">
          They sign in with the email and password below, or with Google if the
          address is on the Google list. Their API token is on their own
          Settings page.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4 rounded-xl border border-line bg-card p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="new-user-name">
              Name
            </label>
            <input
              id="new-user-name"
              required
              maxLength={100}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="field"
            />
          </div>
          <div>
            <label className="label" htmlFor="new-user-email">
              Email
            </label>
            <input
              id="new-user-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="field"
            />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="new-user-password">
            Password <span className="font-normal normal-case">(optional)</span>
          </label>
          <input
            id="new-user-password"
            type="text"
            minLength={8}
            autoComplete="off"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Leave empty to generate one"
            className="field"
          />
        </div>

        <fieldset>
          <legend className="label">Permissions</legend>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {PERMISSIONS.map((permission) => (
              <label key={permission} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={permissions.includes(permission)}
                  onChange={(event) =>
                    togglePermission(permission, event.target.checked)
                  }
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                {PERMISSION_LABELS[permission]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create account"}
          </button>
          {error && <span className="text-sm text-accent">{error}</span>}
        </div>
      </form>

      {created && (
        <div
          role="status"
          className="space-y-2 rounded-xl border border-accent bg-accent-soft p-4 text-sm"
        >
          <p>
            <strong>{created.name}</strong> ({created.email}) can sign in now.
          </p>
          {created.password ? (
            <>
              <p className="text-muted">
                Their password, shown only this once — pass it on and have them
                keep it in a password manager:
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded-lg border border-line bg-card px-3 py-2 font-mono text-xs">
                  {created.password}
                </code>
                <button
                  type="button"
                  onClick={copyPassword}
                  className="rounded-lg border border-line px-3 py-2 text-sm hover:border-accent hover:text-accent"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </>
          ) : (
            <p className="text-muted">They use the password you typed.</p>
          )}
        </div>
      )}
    </section>
  );
}
