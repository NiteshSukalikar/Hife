const CLOUD_NAME = "dmt30rbt7";
const UPLOAD_PRESET = "hife_unsigned";

export async function uploadImage(uri) {
  const formData = new FormData();

  formData.append("file", {
    uri,
    type: "image/jpeg",
    name: "upload.jpg",
  });

  formData.append("upload_preset", UPLOAD_PRESET);

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

  return data.secure_url;
}
