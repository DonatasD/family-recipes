"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import SignOutButton from "@/components/SignOutButton";
import { can, type Permission } from "@/lib/permissions";

type NavLink = { href: string; label: string; needs?: Permission };

/** What you do in the kitchen: always in view on wide screens. */
const primaryLinks: NavLink[] = [
  { href: "/recipes/new", label: "Add recipe", needs: "recipes:create" },
  { href: "/grocery", label: "Grocery list", needs: "grocery" },
];

/** About the account: behind the greeting on wide screens. */
const accountLinks: NavLink[] = [
  { href: "/users", label: "Users", needs: "users:manage" },
  { href: "/settings", label: "Settings" },
];

export type NavUser = {
  name: string;
  email: string;
  permissions: Permission[];
};

/**
 * Header navigation. Wide screens show the primary links inline and tuck the
 * account links and sign-out behind a menu labelled with the greeting; below
 * `md` everything stacks behind one menu button, in the same two groups.
 * Open states are keyed to the pathname so client-side navigation — which
 * keeps this component mounted — closes the menus without an effect.
 */
export default function SiteNav({
  salutation,
  user,
}: {
  salutation: string;
  user: NavUser;
}) {
  const pathname = usePathname();
  const [menuOpenAt, setMenuOpenAt] = useState<string | null>(null);
  const [accountOpenAt, setAccountOpenAt] = useState<string | null>(null);
  const menuOpen = menuOpenAt === pathname;
  const accountOpen = accountOpenAt === pathname;

  const accountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!accountOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpenAt(null);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountOpenAt(null);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountOpen]);

  const allowed = (links: NavLink[]) =>
    links.filter((link) => !link.needs || can(user, link.needs));
  const primary = allowed(primaryLinks);
  const account = allowed(accountLinks);
  const initial = user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <>
      {/* Below md: one button for everything. */}
      <button
        type="button"
        aria-expanded={menuOpen}
        aria-controls="site-nav"
        onClick={() => setMenuOpenAt(menuOpen ? null : pathname)}
        className="-mr-2 ml-auto rounded-lg p-2 hover:text-accent md:hidden"
      >
        <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {menuOpen ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>

      <nav
        id="site-nav"
        className={`${menuOpen ? "flex" : "hidden"} basis-full flex-col border-t border-line pt-3 text-sm md:ml-auto md:flex md:basis-auto md:flex-row md:items-center md:gap-5 md:border-0 md:pt-0`}
      >
        {primary.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={pathname === link.href ? "page" : undefined}
            // Taller rows below md so the links are comfortable to tap.
            className="py-2 hover:text-accent aria-[current]:text-accent md:py-0"
          >
            {link.label}
          </Link>
        ))}

        {/* Below md: the account group as a labelled section of the same list. */}
        <div className="mt-2 border-t border-line pt-3 md:hidden">
          <p className="flex items-center gap-2 py-1 font-display text-base">
            <Avatar initial={initial} />
            {salutation}
          </p>
          {account.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className="block py-2 hover:text-accent aria-[current]:text-accent"
            >
              {link.label}
            </Link>
          ))}
          <SignOutButton className="mt-2 w-full rounded-lg border border-line py-2 text-center hover:border-accent hover:text-accent" />
        </div>

        {/* md and up: the same group behind the greeting. */}
        <div ref={accountRef} className="relative hidden md:block">
          <button
            type="button"
            aria-expanded={accountOpen}
            aria-haspopup="menu"
            aria-controls="account-menu"
            onClick={() => setAccountOpenAt(accountOpen ? null : pathname)}
            className="flex items-center gap-2 rounded-full border border-line bg-card py-1 pl-1 pr-3 hover:border-accent hover:text-accent"
          >
            <Avatar initial={initial} />
            {/* The greeting needs room; between md and lg the name alone has to do. */}
            <span className="hidden lg:inline">{salutation}</span>
            <span className="lg:hidden">{user.name.split(" ")[0]}</span>
            <svg
              viewBox="0 0 20 20"
              aria-hidden
              className={`h-4 w-4 transition-transform ${accountOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 8l4 4 4-4" />
            </svg>
          </button>

          {accountOpen && (
            <div
              id="account-menu"
              role="menu"
              className="absolute right-0 z-20 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-card shadow-lg"
            >
              <div className="border-b border-line px-4 py-3">
                <div className="truncate font-medium">{user.name}</div>
                <div className="truncate text-xs text-muted">{user.email}</div>
              </div>
              <div className="py-1">
                {account.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    aria-current={pathname === link.href ? "page" : undefined}
                    className="block px-4 py-2 hover:bg-accent-soft hover:text-accent aria-[current]:text-accent"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="border-t border-line py-1">
                <SignOutButton className="block w-full px-4 py-2 text-left hover:bg-accent-soft hover:text-accent" />
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}

function Avatar({ initial }: { initial: string }) {
  return (
    <span
      aria-hidden
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent font-display text-sm text-white"
    >
      {initial}
    </span>
  );
}
