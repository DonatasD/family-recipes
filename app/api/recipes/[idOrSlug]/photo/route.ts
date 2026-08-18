import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getApiUser } from "@/lib/auth";
import { jsonError, notFound, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/db";
import { recipeInclude, serializeRecipe } from "@/lib/recipes";

export const runtime = "nodejs";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
// Vercel caps a serverless request body at 4.5 MB. The browser form sidesteps
// this by uploading straight to Blob storage (see /api/blob/upload).
const MAX_BYTES = 4 * 1024 * 1024;

type Params = { params: Promise<{ idOrSlug: string }> };

/**
 * POST /api/recipes/:idOrSlug/photo
 * multipart/form-data with a single `file` field.
 */
export async function POST(request: Request, { params }: Params) {
  const user = await getApiUser(request);
  if (!user) return unauthorized();

  const idOrSlug = (await params).idOrSlug;
  const recipe = await prisma.recipe.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    select: { id: true, slug: true },
  });
  if (!recipe) return notFound();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, "Expected multipart/form-data with a `file` field");
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return jsonError(400, "Missing `file` field");
  }
  if (!ALLOWED.includes(file.type)) {
    return jsonError(415, `Unsupported image type: ${file.type || "unknown"}`, {
      allowed: ALLOWED,
    });
  }
  if (file.size > MAX_BYTES) {
    return jsonError(413, "Image is larger than 4 MB", {
      hint: "Upload it through the website, which sends large files straight to Blob storage.",
    });
  }

  const blob = await put(`recipes/${recipe.slug}`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type,
  });

  const updated = await prisma.recipe.update({
    where: { id: recipe.id },
    data: { imageUrl: blob.url },
    include: recipeInclude,
  });

  return NextResponse.json(serializeRecipe(updated));
}
