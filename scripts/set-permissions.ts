/**
 * Changes what an existing account may do, without touching its password.
 * This is how the first person gets `users:manage`, and the way back if the
 * last person who had it ever loses it.
 *
 *   npm run user:permissions -- --email don@example.com --set all
 *   npm run user:permissions -- --email ugne@example.com --grant users:manage
 *   npm run user:permissions -- --email guest@example.com --revoke recipes:delete,grocery
 */
import { existsSync } from "node:fs";

import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";
import {
  PERMISSIONS,
  normalizePermissions,
  parsePermissionList,
} from "../lib/permissions";

// Target the same database the app is using: .env.local if present, else .env.
loadEnv({ path: existsSync(".env.local") ? ".env.local" : ".env" });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

function usage(): never {
  console.error(
    "Usage: npm run user:permissions -- --email <email> (--set all|none|<ids> | --grant <ids> | --revoke <ids>)\n" +
      `Permission ids: ${PERMISSIONS.join(", ")}`
  );
  process.exit(1);
}

async function main() {
  const email = arg("email")?.trim().toLowerCase();
  const set = arg("set");
  const grant = arg("grant");
  const revoke = arg("revoke");
  if (!email || [set, grant, revoke].filter((v) => v !== undefined).length !== 1) usage();

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { permissions: true },
  });
  if (!existing) {
    console.error(`No account with the email ${email}. Create one with user:add first.`);
    process.exit(1);
  }

  let permissions: string[];
  if (set !== undefined) {
    permissions = parsePermissionList(set) ?? usage();
  } else {
    const delta = parsePermissionList((grant ?? revoke)!) ?? usage();
    const current = normalizePermissions(existing.permissions);
    permissions =
      grant !== undefined
        ? [...current, ...delta]
        : current.filter((p) => !delta.includes(p));
  }

  const user = await prisma.user.update({
    where: { email },
    data: { permissions: normalizePermissions(permissions) },
    select: { name: true, email: true, permissions: true },
  });
  console.log(
    `\n  ${user.name} <${user.email}> can now: ${user.permissions.join(", ") || "(read and rate only)"}\n`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
