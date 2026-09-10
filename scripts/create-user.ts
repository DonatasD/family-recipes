/**
 * Creates (or updates) an account.
 *
 *   npm run user:add -- --email don@example.com --name Don --permissions all
 *   npm run user:add -- --email ugne@example.com --name Ugnė --password "…"
 *   npm run user:add -- --email guest@example.com --name Guest --permissions none
 *
 * Without --password a strong one is generated and printed once. New accounts
 * get every permission except users:manage unless --permissions says otherwise
 * ("all", "none", or a comma-separated list); an existing account keeps its
 * permissions unless --permissions is given.
 */
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";

import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../generated/prisma/client";
import { parsePermissionList } from "../lib/permissions";

// Target the same database the app is using: .env.local if present, else .env.
loadEnv({ path: existsSync(".env.local") ? ".env.local" : ".env" });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const name = arg("name")?.trim();

  const permissionsArg = arg("permissions");
  const permissions =
    permissionsArg === undefined ? undefined : parsePermissionList(permissionsArg);

  if (!email || !name || permissions === null) {
    console.error(
      'Usage: npm run user:add -- --email <email> --name <name> [--password "<password>"] [--permissions all|none|<id,id,…>]'
    );
    process.exit(1);
  }

  const password = arg("password") ?? randomBytes(12).toString("base64url");
  const generated = !arg("password");

  const passwordHash = await bcrypt.hash(password, 12);
  const apiToken = `rcp_${randomBytes(24).toString("base64url")}`;

  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name, passwordHash, apiToken, ...(permissions ? { permissions } : {}) },
    // An existing account keeps its API token (and permissions, unless
    // --permissions is given); only the password is reset.
    update: { name, passwordHash, ...(permissions ? { permissions } : {}) },
    select: { id: true, email: true, name: true, apiToken: true, permissions: true },
  });

  console.log(`\n  Account ready: ${user.name} <${user.email}>`);
  console.log(`  Permissions:   ${user.permissions.join(", ") || "(read and rate only)"}`);
  if (generated) console.log(`  Password:      ${password}`);
  console.log(`  API token:     ${user.apiToken}\n`);
  console.log("  Store both in a password manager — they are not shown again.\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
