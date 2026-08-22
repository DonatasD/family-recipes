/**
 * Prints which database mode is active. Two modes exist:
 *
 *   local  — no .env.local; everything reads .env (the Docker Postgres)
 *   remote — .env.local -> .env.remote (Neon, the production database)
 *
 * Switch with `npm run env:local` / `npm run env:remote`, then restart
 * `next dev` — Next.js only reads env files at startup.
 */
import { existsSync, lstatSync, readFileSync, readlinkSync } from "node:fs";

const active = existsSync(".env.local") ? ".env.local" : ".env";

let label;
if (active === ".env") {
  label = "local (isolated) — no .env.local, using .env";
} else {
  const link = lstatSync(".env.local").isSymbolicLink()
    ? ` -> ${readlinkSync(".env.local")}`
    : " (plain file)";
  label = `remote (production) — .env.local${link}`;
}

const match = readFileSync(active, "utf8").match(
  /^DATABASE_URL\s*=\s*"?(?:postgres(?:ql)?:\/\/)[^@\n]*@([^/\s"?]+)/m
);
const host = match ? match[1] : "could not parse DATABASE_URL";

console.log(`\n  Mode:     ${label}`);
console.log(`  Database: ${host}`);
console.log(`\n  Restart \`npm run dev\` after switching modes.\n`);
