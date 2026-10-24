// Where product images may come from. next/image only optimises images from these places,
// so anything else (e.g. a link from another website) is copied into the shop on import.
export const IMAGE_HOSTS = ["in.teabox.com", "cdn.shopify.com", "assets.replocdn.com"];

/** Photos uploaded in the admin are stored in the database and served from here. */
export const MEDIA_PREFIX = "/api/media/";

export function isAllowedImage(src: string) {
  if (src.startsWith("/") && !src.startsWith("//")) return true;
  try {
    const url = new URL(src);
    return url.protocol === "https:" && IMAGE_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}
