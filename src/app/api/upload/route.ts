import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse, type NextRequest } from "next/server";
import { checkGate } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

/**
 * Screenshots go straight from the browser to blob storage.
 *
 * They do NOT pass through this function — a serverless request body is capped
 * around 4.5 MB and a phone screenshot clears that easily. This route only
 * issues a short-lived token, and states what that token is allowed to upload.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        /* The same daily gate the text submissions use. Without it the token
           endpoint is an open invitation to fill the storage quota. */
        const gate = await checkGate(req);
        if (!gate.ok) throw new Error("Enough for today. Come back tomorrow.");

        return {
          allowedContentTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
          maximumSizeInBytes: 5 * 1024 * 1024,
          addRandomSuffix: true,
          // The uploader chooses the name; never trust it to be unique or safe.
          tokenPayload: null,
        };
      },
      onUploadCompleted: async () => {
        /* Nothing to do. The URL reaches the database through the submit form,
           and the entry sits in the moderation queue with the image attached —
           so an uploaded file is not public until the entry is. */
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
