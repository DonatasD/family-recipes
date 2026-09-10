import type { Metadata } from "next";
import { Baloo_2, Nunito } from "next/font/google";
import Link from "next/link";

import { getSessionUser } from "@/lib/auth";
import CatDoodles from "@/components/CatDoodles";
import GardenScene from "@/components/GardenScene";
import LogoMark from "@/components/LogoMark";
import SiteNav from "@/components/SiteNav";
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

/** Time-of-day greeting in Lithuanian, on Vilnius time wherever the server runs. */
function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hour12: false,
      timeZone: "Europe/Vilnius",
    }).format(new Date())
  );
  if (hour < 5 || hour >= 23) return "Labanakt";
  if (hour < 11) return "Labas rytas";
  if (hour < 17) return "Labas";
  return "Labas vakaras";
}

/** Lithuanian vocative for the two names in this house: Ugnė → Ugne, Donatas → Donatai; anything else passes through. */
function vocative(name: string): string {
  const first = name.split(" ")[0];
  if (first.endsWith("ė")) return `${first.slice(0, -1)}e`;
  if (first.endsWith("as")) return `${first.slice(0, -2)}ai`;
  return first;
}

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
        <header className="border-b border-line bg-accent-soft">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
            <Link
              href="/"
              // min-w-0 + flex-1: on the narrowest phones the title wraps instead of pushing the menu button onto a second row
              className="flex min-w-0 flex-1 items-center gap-2 font-display text-lg tracking-tight hover:text-accent md:flex-none md:text-xl"
            >
              <LogoMark className="h-8 w-auto shrink-0" />
              Don &amp; Ugnė&rsquo;s Recipes
            </Link>

            {user && (
              <SiteNav
                salutation={`${greeting()}, ${vocative(user.name)}!`}
                user={{
                  name: user.name,
                  email: user.email,
                  permissions: user.permissions,
                }}
              />
            )}
          </div>
        </header>

        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">
          {children}
        </main>

        <footer className="mx-auto flex w-full max-w-5xl items-end gap-4 px-5 pb-4 pt-4 text-xs text-muted">
          <span>Made for two people who cook — and two cats who supervise.</span>
          <CatDoodles className="h-14 w-auto shrink-0" />
        </footer>

        <GardenScene />
      </body>
    </html>
  );
}
