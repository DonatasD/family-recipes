/**
 * Permission checks shared by API routes, MCP tools, server components and
 * client components alike — so no Prisma or `server-only` imports here.
 * Reading recipes and rating them need no permission at all.
 */

export const PERMISSIONS = [
  "recipes:create",
  "recipes:edit",
  "recipes:delete",
  "grocery",
  "users:manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  "recipes:create": "Add recipes",
  "recipes:edit": "Edit recipes",
  "recipes:delete": "Delete recipes",
  grocery: "Grocery list",
  "users:manage": "Manage people",
};

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  "recipes:create": "Add new recipes, through the site, the API or MCP.",
  "recipes:edit": "Change existing recipes and attach photos.",
  "recipes:delete": "Remove recipes for everyone.",
  grocery: "See and plan the shared grocery list.",
  "users:manage": "Change what other people may do.",
};

/** What `user:add` grants when nothing is specified: everything but managing people. */
export const DEFAULT_PERMISSIONS: readonly Permission[] = [
  "recipes:create",
  "recipes:edit",
  "recipes:delete",
  "grocery",
];

export function isPermission(value: unknown): value is Permission {
  return (
    typeof value === "string" && (PERMISSIONS as readonly string[]).includes(value)
  );
}

/** Keeps only known ids, in canonical order, without duplicates. */
export function normalizePermissions(values: readonly string[]): Permission[] {
  return PERMISSIONS.filter((permission) => values.includes(permission));
}

/**
 * For the command line: "all", "none", or a comma-separated list of ids.
 * Returns null when any id is unknown so the caller can print usage.
 */
export function parsePermissionList(input: string): Permission[] | null {
  const trimmed = input.trim().toLowerCase();
  if (trimmed === "all") return [...PERMISSIONS];
  if (trimmed === "none" || trimmed === "") return [];
  const ids = trimmed.split(",").map((id) => id.trim()).filter(Boolean);
  return ids.every(isPermission) ? normalizePermissions(ids) : null;
}

type HasPermissions = { permissions: readonly string[] };

export function can(user: HasPermissions, permission: Permission): boolean {
  return user.permissions.includes(permission);
}

/** True when the account can change anything at all (used for wording, not gating). */
export function canWrite(user: HasPermissions): boolean {
  return PERMISSIONS.some(
    (permission) => permission !== "users:manage" && can(user, permission)
  );
}
