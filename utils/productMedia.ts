import type { ImagePickerAsset } from "expo-image-picker";

export const MAX_IMAGE_SIZE_BYTES = 1024 * 1024;

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validateImageAsset(asset: ImagePickerAsset) {
  if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE_BYTES) {
    return `Image must be under ${formatBytes(MAX_IMAGE_SIZE_BYTES)}`;
  }

  return null;
}
