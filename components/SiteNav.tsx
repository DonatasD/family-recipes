"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import SignOutButton from "@/components/SignOutButton";
import { can, type Permission } from "@/lib/permissions";

const links: { href: string; label: string; needs?: Permission }[] = [
  { href: "/recipes/new", label: "Add recipe", needs: "recipes:create" },
  { href: "/grocery", label: "Grocery list", needs: "grocery" },
  { href: "/users", label: "Users", needs: "users:manage" },
  { href: "/settings", label: "Settings" },
];

/**
 * Header navigation: inline on wide screens, behind a menu button below `md`.
 * The open state is keyed to the pathname so client-side navigation — which
 * keeps this component mounted — closes the menu without an effect.
 */
export default function SiteNav({
  salutation,
  permissions,
}: {
  salutation: string;
  permissions: Permission[];
}) {
  const user = { permissions };
  const pathname = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="site-nav"
        onClick={() => setOpenAt(open ? null : pathname)}
        className="-mr-2 ml-auto rounded-lg p-2 hover:text-accent md:hidden"
      >
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>

      <nav
        id="site-nav"
        className={`${open ? "flex" : "hidden"} basis-full flex-col gap-1 border-t border-line pt-3 text-sm md:ml-auto md:flex md:basis-auto md:flex-row md:items-center md:gap-4 md:border-0 md:pt-0`}
      >
        {links
          .filter((link) => !link.needs || can(user, link.needs))
          .map((link) => (
            <Link
              key={link.href}
              href={link.href}
              // Taller rows below md so the links are comfortable to tap.
              className="py-2 hover:text-accent md:py-0"
            >
              {link.label}
            </Link>
          ))}
        {/* ink at 80% instead of muted: muted misses AA on this green.
            Dropped between md and lg where the row is too tight for it. */}
        <span className="py-2 text-ink/80 md:hidden md:py-0 lg:inline">
          {salutation}
        </span>
        <SignOutButton />
      </nav>
    </>
  );
}
