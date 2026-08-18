# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A private two-person recipe collection ("Don & Ugnė's Recipes"): Next.js 16 App Router + React 19, Prisma/PostgreSQL, Tailwind v4, Vercel Blob for photos. Every route requires a signed-in user — there is no public/anonymous view.

## Commands

```bash
npm run dev      # next dev
npm run build    # next build
npm run start    # next start
npm run lint     # eslint (flat config, eslint-config-next core-web-vitals + typescript)
npm run db:push  # apply prisma/schema.prisma to the database
npm run user:add -- --email … --name …   # create an account (no signup route exists)
npx prisma generate      # regenerate the client after editing schema.prisma
```

There is no test runner configured.

Required env vars: `DATABASE_URL`, `DIRECT_URL` (pooled vs. direct Postgres), `AUTH_SECRET` (`openssl rand -base64 32`), and `BLOB_READ_WRITE_TOKEN` for Vercel Blob.

## Toolchain constraints

- **Node 22.12+ is required** (Prisma 7 uses `require(esm)`); `.nvmrc` pins 24. On older Node, `prisma generate` fails with `ERR_REQUIRE_ESM`.
- **Prisma 7 specifics.** The generator is `prisma-client` (not `prisma-client-js`) with a mandatory `output`, so the client is imported from `@/generated/prisma/client`, not `@prisma/client`. Connection URLs are **not** allowed in `schema.prisma` — they live in `prisma.config.ts`, and the app connects through the `@prisma/adapter-pg` driver adapter in `lib/db.ts`. `/generated` is gitignored and rebuilt by `postinstall`.

## Architecture

**Two authentication paths, one resolver.** `lib/auth.ts` `getApiUser(request)` tries a `Authorization: Bearer <token>` personal API token first (constant-time compared, prefix `rcp_`), then falls back to the session cookie. API routes call `getApiUser`; server components call `requireUser()` from `lib/guard.ts`, which redirects instead of returning 401. Sessions are HS256 JWTs (`jose`) in the `recipes_session` cookie — `lib/session.ts` is deliberately dependency-light so it stays edge-safe, while `lib/auth.ts` is `server-only` (Prisma + bcrypt).

**Recipes are addressable by id or slug.** Every `/api/recipes/[idOrSlug]/*` route resolves with `findFirst({ OR: [{ id }, { slug }] })`. Slugs come from `slugify()` (strips Lithuanian diacritics) plus `uniqueSlug()`, which appends `-2`, `-3`… A `PATCH` that changes the title re-slugs; any other edit leaves the existing URL intact.

**One serializer for the whole app.** `serializeRecipe()` in `lib/recipes.ts` (paired with the `recipeInclude` Prisma selection) produces the single JSON shape used by both API responses and pages, adding derived `totalMinutes` and `averageStars`. Add fields there rather than shaping data per-route. `ingredients` and `steps` are `Json` columns, typed only through the Zod schemas.

**Validation and errors.** Request bodies go through Zod schemas in `lib/recipes.ts`; `lib/api.ts` wraps the responses (`unauthorized` 401, `notFound` 404, `validationError` 422 flattening Zod issues into `{ field: message }`, `readJson` returning `null` instead of throwing on bad JSON). Follow that pattern in new routes. Note `recipeCreateSchema` accepts an ingredient as either an object or a bare string.

**Photo uploads have two paths.** `POST /api/recipes/:idOrSlug/photo` takes multipart form-data but is capped at 4 MB because Vercel limits serverless request bodies to 4.5 MB — that path is for API/CLI clients. The browser instead gets a client token from `POST /api/blob/upload` and uploads straight to Blob storage (15 MB), then saves the returned URL onto the recipe via `PATCH`. `onUploadCompleted` is intentionally a no-op so uploads work on localhost with no public callback URL.

**Ratings are per-user upserts.** One `Rating` row per `(userId, recipeId)`; `stars` may be `null` when a recipe is only favourited, and `averageStars` ignores those.

All API routes pin `export const runtime = "nodejs"` (Prisma + bcrypt).

## Conventions

- Path alias `@/*` maps to the repo root (`@/lib/db`, `@/components/…`).
- Tailwind v4 with no config file: the palette lives in `@theme` blocks in `app/globals.css` as semantic tokens (`paper`, `ink`, `muted`, `line`, `card`, `accent`, `accent-soft`, `font-display`) with a `prefers-color-scheme: dark` override. Use those tokens (`text-muted`, `border-line`) rather than raw zinc/gray classes. Shared form styling is the `.field` / `.label` classes in the same file.
- Comments in this codebase explain *why* (a platform limit, a security choice), not what the line does. Match that.
- Do not mention Claude or AI assistance anywhere in `README.md`, and do not add a co-author trailer to commits.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
