import type { ImagePickerAsset } from "expo-image-picker";

export const MAX_IMAGE_SIZE_BYTES = 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
export const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateImageAsset(asset: ImagePickerAsset) {
  const mimeType = asset.mimeType?.toLowerCase();
  const extension = asset.fileName?.split(".").pop()?.toLowerCase();

  if (
    (mimeType && !ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) ||
    (!mimeType && extension && !ALLOWED_IMAGE_EXTENSIONS.has(extension))
  ) {
    return "Image must be JPG, PNG, or WebP.";
  }

  if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE_BYTES) {
    return `Image must be under ${formatBytes(MAX_IMAGE_SIZE_BYTES)}`;
  }

  return null;
}

export function getUploadMimeType(uri: string) {
  const extension = uri.split("?")[0].split(".").pop()?.toLowerCase();

  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "image/jpeg";
}
