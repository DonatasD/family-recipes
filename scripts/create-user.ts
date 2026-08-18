/**
 * Creates (or updates) an account.
 *
 *   npm run user:add -- --email don@example.com --name Don
 *   npm run user:add -- --email ugne@example.com --name Ugnė --password "…"
 *
 * Without --password a strong one is generated and printed once.
 */
import { randomBytes } from "node:crypto";

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../generated/prisma/client";

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

  if (!email || !name) {
    console.error(
      'Usage: npm run user:add -- --email <email> --name <name> [--password "<password>"]'
    );
    process.exit(1);
  }

  const password = arg("password") ?? randomBytes(12).toString("base64url");
  const generated = !arg("password");

  const passwordHash = await bcrypt.hash(password, 12);
  const apiToken = `rcp_${randomBytes(24).toString("base64url")}`;

  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name, passwordHash, apiToken },
    // An existing account keeps its API token; only the password is reset.
    update: { name, passwordHash },
    select: { id: true, email: true, name: true, apiToken: true },
  });

  console.log(`\n  Account ready: ${user.name} <${user.email}>`);
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
