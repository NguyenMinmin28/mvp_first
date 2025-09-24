import { NextRequest, NextResponse } from "next/server";

// Securely delete a Cloudinary image by public_id using Admin API
// Body: { publicId: string }
export async function POST(request: NextRequest) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Cloudinary server env not configured" }, { status: 500 });
    }

    const body = await request.json();
    const publicId = typeof body?.publicId === "string" ? body.publicId.trim() : "";
    if (!publicId) {
      return NextResponse.json({ error: "publicId required" }, { status: 400 });
    }

    const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload`;
    const params = new URLSearchParams();
    params.append("public_ids[]", publicId);

    const res = await fetch(`${url}?${params.toString()}`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json({ error: text || "Failed to delete resource" }, { status: 502 });
    }
    const json = await res.json().catch(() => ({}));
    return NextResponse.json({ success: true, result: json });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}


