import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// Minimal signature endpoint for Cloudinary signed uploads
// Expects JSON body with { folder?: string, timestamp?: number }
// Returns { cloudName, apiKey, timestamp, folder, signature }

export async function POST(request: NextRequest) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Cloudinary server env not configured" }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const folder = typeof body.folder === "string" ? body.folder : "avatars";
    const resourceType = body.resourceType === "raw" ? "raw" : "image";
    const publicId = typeof body.publicId === "string" && body.publicId.length > 0 ? body.publicId : undefined;
    const useFilename = body.useFilename === true ? true : undefined;
    const uniqueFilename = body.uniqueFilename === false ? false : undefined; // default true, allow false
    const timestamp = Number.isFinite(body.timestamp) ? body.timestamp : Math.floor(Date.now() / 1000);

    // Build params to sign (alphabetical by key)
    const params: Record<string, string> = { folder, timestamp: String(timestamp) };
    if (publicId) params.public_id = publicId;
    if (useFilename !== undefined) params.use_filename = String(useFilename);
    if (uniqueFilename !== undefined) params.unique_filename = String(uniqueFilename);

    const toSign = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&");
    const signature = crypto.createHash("sha1").update(toSign + apiSecret).digest("hex");

    return NextResponse.json({ cloudName, apiKey, timestamp, folder, signature, resourceType, publicId, useFilename: !!useFilename, uniqueFilename });
  } catch (err) {
    return NextResponse.json({ error: "Failed to sign upload" }, { status: 500 });
  }
}


