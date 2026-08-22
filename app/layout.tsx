import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import Link from "next/link";

import { getSessionUser } from "@/lib/auth";
import CatDoodles from "@/components/CatDoodles";
import GardenScene from "@/components/GardenScene";
import SignOutButton from "@/components/SignOutButton";
import "./globals.css";

// latin-ext keeps Lithuanian titles (Šaltibarščiai, Ugnė) in the same face.
const baloo = Baloo_2({
  subsets: ["latin", "latin-ext"],
  variable: "--font-baloo",
});

const nunito = Nunito({
  subsets: ["latin", "latin-ext"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Don & Ugnė's Recipes",
  description: "Our recipe collection",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();

  return (
    <html lang="en" className={`${baloo.variable} ${nunito.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:text-white"
        >
          Skip to content
        </a>
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
                <Link href="/grocery" className="hover:text-accent">
                  Grocery list
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

        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
          {children}
        </main>

        <footer className="mx-auto flex w-full max-w-5xl items-end justify-between gap-4 px-5 pb-4 pt-4 text-xs text-muted">
          <span>Made for two people who cook — and two cats who supervise.</span>
          <CatDoodles className="h-14 w-auto shrink-0" />
        </footer>

        <GardenScene />
      </body>
    </html>
  );
}
