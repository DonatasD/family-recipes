"use client";

import { useState } from "react";

import NewUserForm from "@/components/NewUserForm";
import {
  PERMISSIONS,
  PERMISSION_DESCRIPTIONS,
  PERMISSION_LABELS,
  type Permission,
} from "@/lib/permissions";

export type Person = {
  id: string;
  email: string;
  name: string;
  permissions: Permission[];
};

/** The /users page: a checkbox per person per permission, saved on change. */
export default function PeoplePanel({
  people: initialPeople,
  currentUserId,
}: {
  people: Person[];
  currentUserId: string;
}) {
  const [people, setPeople] = useState(initialPeople);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function toggle(person: Person, permission: Permission, granted: boolean) {
    const permissions = granted
      ? [...person.permissions, permission]
      : person.permissions.filter((p) => p !== permission);

    setBusyId(person.id);
    setMessage(null);

    const response = await fetch(`/api/users/${person.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions }),
    });

    if (response.ok) {
      const updated = (await response.json()) as Person;
      setPeople((list) => list.map((p) => (p.id === person.id ? updated : p)));
      setMessage(
        `${person.name} can ${granted ? "now" : "no longer"} ${PERMISSION_LABELS[
          permission
        ].toLowerCase()}.`
      );
    } else {
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setMessage(body?.error ?? "Couldn't save that change.");
    }
    setBusyId(null);
  }

  return (
    <>
      <section className="space-y-4">
        <p className="text-sm text-muted">
          Who may do what. Everyone can read and rate recipes; the rest is granted
          here and applies straight away, API tokens and MCP included.
        </p>

        <div className="overflow-x-auto rounded-xl border border-line bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th scope="col" className="px-4 py-3 font-semibold">
                  Person
                </th>
                {PERMISSIONS.map((permission) => (
                  <th
                    key={permission}
                    scope="col"
                    className="px-3 py-3 text-center font-semibold"
                    title={PERMISSION_DESCRIPTIONS[permission]}
                  >
                    {PERMISSION_LABELS[permission]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {people.map((person) => (
                <tr key={person.id}>
                  <th scope="row" className="px-4 py-3 text-left font-normal">
                    <div className="font-medium">
                      {person.name}
                      {person.id === currentUserId && (
                        <span className="ml-2 text-xs text-muted">(you)</span>
                      )}
                    </div>
                    <div className="text-xs text-muted">{person.email}</div>
                  </th>
                  {PERMISSIONS.map((permission) => (
                    <td key={permission} className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        aria-label={`${PERMISSION_LABELS[permission]} for ${person.name}`}
                        checked={person.permissions.includes(permission)}
                        disabled={busyId === person.id}
                        onChange={(event) =>
                          toggle(person, permission, event.target.checked)
                        }
                        className="h-4 w-4 accent-[var(--color-accent)]"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="grid gap-x-6 gap-y-1 text-xs text-muted sm:grid-cols-[auto_1fr]">
          {PERMISSIONS.map((permission) => (
            <div key={permission} className="contents">
              <dt className="font-semibold">{PERMISSION_LABELS[permission]}</dt>
              <dd>{PERMISSION_DESCRIPTIONS[permission]}</dd>
            </div>
          ))}
        </dl>

        <p role="status" className="min-h-5 text-sm text-muted">
          {message}
        </p>
      </section>

      <NewUserForm
        onCreated={(person) => setPeople((list) => [...list, person])}
      />
    </>
  );
}
