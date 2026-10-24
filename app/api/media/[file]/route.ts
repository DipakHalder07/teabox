import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Serves product photos uploaded in the admin: /api/media/<id>.webp. A file never changes after
// upload (a new photo gets a new id), so browsers and the CDN may cache it for a year.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  const id = (await params).file.replace(/\.[a-z0-9]+$/i, "");
  if (!/^[a-z0-9]{10,40}$/i.test(id)) return new NextResponse("Not found", { status: 404 });

  const media = await prisma.mediaFile.findUnique({ where: { id }, select: { data: true, mimeType: true } });
  if (!media) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(new Uint8Array(media.data), {
    headers: {
      "Content-Type": media.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
