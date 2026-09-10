import Link from "next/link";

import { PERMISSION_LABELS, type Permission } from "@/lib/permissions";

/** Shown in place of a page the signed-in account lacks the permission for. */
export default function NoPermissionNotice({ needs }: { needs: Permission }) {
  return (
    <div className="max-w-xl space-y-4">
      <h1 className="font-display text-3xl">Not on your account</h1>
      <p className="text-muted">
        This page needs the <strong>{PERMISSION_LABELS[needs]}</strong>{" "}
        permission, which your account doesn&rsquo;t have. You can still browse
        and rate every recipe. Ask Don or Ugnė if you need more.
      </p>
      <Link href="/" className="text-sm text-accent hover:underline">
        ← Back to the recipes
      </Link>
    </div>
  );
}
