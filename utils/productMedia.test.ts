import { describe, expect, it } from "vitest";

import {
  MAX_IMAGE_SIZE_BYTES,
  formatBytes,
  getUploadMimeType,
  validateImageAsset,
} from "@/utils/productMedia";

describe("product media helpers", () => {
  it("formats image byte sizes", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(MAX_IMAGE_SIZE_BYTES)).toBe("1.0 MB");
  });

  it("accepts allowed image assets and rejects unsupported formats", () => {
    expect(
      validateImageAsset({
        uri: "file:///photo.webp",
        width: 1,
        height: 1,
        mimeType: "image/webp",
      })
    ).toBeNull();
    expect(
      validateImageAsset({
        uri: "file:///photo.gif",
        width: 1,
        height: 1,
        mimeType: "image/gif",
      })
    ).toBe("Image must be JPG, PNG, or WebP.");
  });

  it("rejects images over the upload limit", () => {
    expect(
      validateImageAsset({
        uri: "file:///photo.jpg",
        width: 1,
        height: 1,
        fileSize: MAX_IMAGE_SIZE_BYTES + 1,
      })
    ).toBe("Image must be under 1.0 MB");
  });

  it("detects upload MIME type from URI", () => {
    expect(getUploadMimeType("file:///photo.png?cache=1")).toBe("image/png");
    expect(getUploadMimeType("file:///photo.webp")).toBe("image/webp");
    expect(getUploadMimeType("file:///photo.jpg")).toBe("image/jpeg");
  });
});
