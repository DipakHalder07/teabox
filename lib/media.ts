import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { MEDIA_PREFIX } from "@/lib/productImages";

// Every product photo is saved as a 600 × 600 WebP, matching the shop's product images
export const PHOTO_SIZE = 600;

/**
 * Stores an image as a square 600 × 600 WebP in the database, keeping the centre square of
 * photos that aren't square. Re-encoding also proves the file is a real image and strips camera
 * metadata (such as GPS location) from phone photos.
 */
export async function saveImage(input: Buffer) {
  const image = sharp(input, { failOn: "error" }).rotate();
  const { data, info } = await image
    .resize({ width: PHOTO_SIZE, height: PHOTO_SIZE, fit: "cover", position: "centre" })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  const file = await prisma.mediaFile.create({
    data: { mimeType: "image/webp", data: new Uint8Array(data), size: data.length, width: info.width, height: info.height },
    select: { id: true },
  });
  return { url: `${MEDIA_PREFIX}${file.id}.webp`, width: info.width, height: info.height };
}
