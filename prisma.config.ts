import { existsSync } from "node:fs";

import { config as loadEnv } from "dotenv";
import { defineConfig } from "prisma/config";

// Same file the app resolves: .env.local (remote mode) if present, else .env
// (local Docker). Exactly one file — merging both would pair one database's
// pooled URL with the other's direct URL. See scripts/env-status.mjs.
loadEnv({ path: existsSync(".env.local") ? ".env.local" : ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Schema changes go over the direct (unpooled) connection; the running
    // app uses the pooled DATABASE_URL via the adapter in lib/db.ts.
    // (.env names it DIRECT_URL; Vercel pulls name it DATABASE_URL_UNPOOLED.)
    url:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL_UNPOOLED ??
      process.env.DATABASE_URL ??
      "",
  },
});
