import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api";

export const runtime = "nodejs";

/**
 * Issues a short-lived token so the browser can upload a photo directly to
 * Blob storage, bypassing the 4.5 MB serverless request-body limit.
 * The client then saves the returned URL onto the recipe.
 */
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const user = await getSessionUser();
        if (!user) throw new Error("Not signed in");

        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/avif",
            "image/gif",
          ],
          maximumSizeInBytes: 15 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      // Not used: the client saves the URL onto the recipe itself, which also
      // keeps photo uploads working on localhost (no public callback URL).
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(
      400,
      error instanceof Error ? error.message : "Upload failed"
    );
  }
}
