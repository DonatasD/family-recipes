import GoogleAllowlistPanel from "@/components/GoogleAllowlistPanel";
import NoPermissionNotice from "@/components/NoPermissionNotice";
import PeoplePanel from "@/components/PeoplePanel";
import { prisma } from "@/lib/db";
import { isGoogleLoginEnabled } from "@/lib/google";
import { listAllowedEmails } from "@/lib/google-allowlist";
import { requireUser } from "@/lib/guard";
import { can, normalizePermissions } from "@/lib/permissions";

export const metadata = { title: "Users" };

export default async function UsersPage() {
  const user = await requireUser("/users");
  if (!can(user, "users:manage")) {
    return <NoPermissionNotice needs="users:manage" />;
  }

  const [rows, allowedEmails] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, email: true, name: true, permissions: true },
      orderBy: { createdAt: "asc" },
    }),
    listAllowedEmails(),
  ]);

  return (
    <div className="max-w-3xl space-y-10">
      <h1 className="font-display text-3xl">Users</h1>
      <PeoplePanel
        people={rows.map((row) => ({
          ...row,
          permissions: normalizePermissions(row.permissions),
        }))}
        currentUserId={user.id}
      />
      <GoogleAllowlistPanel
        initialEmails={allowedEmails}
        googleEnabled={isGoogleLoginEnabled()}
      />
    </div>
  );
}
