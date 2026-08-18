import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(status: number, message: string, extra?: unknown) {
  return NextResponse.json(
    extra === undefined ? { error: message } : { error: message, details: extra },
    { status }
  );
}

export const unauthorized = () =>
  jsonError(
    401,
    "Sign in, or send an API token as: Authorization: Bearer <token>"
  );

export const notFound = (what = "Recipe") => jsonError(404, `${what} not found`);

/** Flattens Zod issues into { field: message } so API errors are actionable. */
export function validationError(error: ZodError) {
  const details: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_";
    if (!(path in details)) details[path] = issue.message;
  }
  return jsonError(422, "Validation failed", details);
}

/** Parses a JSON body, returning null (not throwing) on malformed input. */
export async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
