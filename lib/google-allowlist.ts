import "server-only";

import { prisma } from "@/lib/db";
import { envAllowedEmails } from "@/lib/google";

export type AllowlistEntry = {
  email: string;
  /** From GOOGLE_ALLOWED_EMAILS: shown, but only removable by changing the env. */
  locked: boolean;
};

/** Environment entries first, then the ones added on the Users page. */
export async function listAllowedEmails(): Promise<AllowlistEntry[]> {
  const fromEnv = envAllowedEmails();
  const rows = await prisma.googleAllowedEmail.findMany({
    select: { email: true },
    orderBy: { addedAt: "asc" },
  });
  return [
    ...fromEnv.map((email) => ({ email, locked: true })),
    ...rows
      .filter((row) => !fromEnv.includes(row.email))
      .map((row) => ({ email: row.email, locked: false })),
  ];
}
