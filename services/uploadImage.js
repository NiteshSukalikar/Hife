import { getUploadMimeType, MAX_IMAGE_SIZE_BYTES } from "@/utils/productMedia";

const CLOUD_NAME = "dmt30rbt7";
const UPLOAD_PRESET = "hife_unsigned";
const CLOUDINARY_MAX_UPLOAD_BYTES = MAX_IMAGE_SIZE_BYTES;

export async function uploadImage(uri) {
  const formData = new FormData();
  const mimeType = getUploadMimeType(uri);
  const extension = mimeType.split("/")[1].replace("jpeg", "jpg");

  formData.append("file", {
    uri,
    type: mimeType,
    name: `hife-upload.${extension}`,
  });

  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "hife/product-requests");
  formData.append("context", "app=hife");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.error?.message || "Upload failed");
  }

  if (!data.secure_url) {
    throw new Error("Upload finished without an image URL");
  }

  if (Number(data.bytes || 0) > CLOUDINARY_MAX_UPLOAD_BYTES) {
    throw new Error("Uploaded image exceeds the allowed size");
  }

  return data.secure_url;
}
