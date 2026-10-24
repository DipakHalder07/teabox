import { NextRequest, NextResponse } from "next/server";
import { isDatabaseConnected } from "@/lib/prisma";
import { verifyAdminRequest } from "@/lib/auth";
import { saveImage } from "@/lib/media";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

// Product photo upload from Admin → Products (camera or gallery).
export async function POST(req: NextRequest) {
  if (!(await verifyAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isDatabaseConnected())) {
    return NextResponse.json({ error: "Connect the database first (DATABASE_URL)." }, { status: 503 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a photo to upload" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Photo is too large (max 8 MB)" }, { status: 413 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "That file is not an image" }, { status: 400 });

  try {
    return NextResponse.json(await saveImage(Buffer.from(await file.arrayBuffer())), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Couldn't read this image. Try a JPG or PNG photo (iPhone HEIC photos: set Camera → Formats → Most Compatible)." },
      { status: 400 }
    );
  }
}
