import type { Metadata } from "next";
import Link from "next/link";

import { getSessionUser } from "@/lib/auth";
import SignOutButton from "@/components/SignOutButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "Don & Ugnė's Recipes",
  description: "Our recipe collection",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-line">
          <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-4">
            <Link
              href="/"
              className="font-display text-xl tracking-tight hover:text-accent"
            >
              Don &amp; Ugnė&rsquo;s Recipes
            </Link>

            {user && (
              <nav className="ml-auto flex items-center gap-4 text-sm">
                <Link href="/recipes/new" className="hover:text-accent">
                  Add recipe
                </Link>
                <Link href="/settings" className="hover:text-accent">
                  Settings
                </Link>
                <span className="text-muted">{user.name}</span>
                <SignOutButton />
              </nav>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>

        <footer className="mx-auto max-w-5xl px-5 pb-10 pt-4 text-xs text-muted">
          Made for two people who cook.
        </footer>
      </body>
    </html>
  );
}
