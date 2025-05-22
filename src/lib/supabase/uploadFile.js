import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key not found in environment variables");
}

const uploadFileUrl = import.meta.env.VITE_SOCKET_URL;

const uploadFileToTable = async (userId, filePath, bucketName) => {
  const response = await fetch(
    `${uploadFileUrl}/api/personalKnowledge/upload`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        filePath,
        bucketName,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.errors || "Failed to upload file to table");
  }

  return response.json();
};

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadFile(file, bucketName, userId) {
  try {
    if (!file || !bucketName || !userId) {
      throw new Error("File, bucket name, and userId are required");
    }

    const fileExt = file.name.split(".").pop();
    const originalName = file.name.substring(0, file.name.lastIndexOf("."));
    const timestamp = Date.now();
    const fileName = `user/${userId}/${originalName}-${timestamp}.${fileExt}`;

    // Generate a signed URL for the upload
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage.from(bucketName).createSignedUploadUrl(fileName);

    if (signedUrlError) {
      throw signedUrlError;
    }

    const { path: filePath, token } = signedUrlData;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .uploadToSignedUrl(fileName, token, file);

    if (uploadError) {
      throw uploadError;
    }

    await uploadFileToTable(userId, filePath, bucketName);

    return {
      userId: userId,
      filePath: filePath,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    return null;
  }
}

export async function getSignedUrl(bucketName, filePath, expiresIn = 60) {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      throw error;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Error creating signed URL:", error);
    return null;
  }
}

export async function deleteFile(bucketName, filePath) {
  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
}

export default { uploadFile, getSignedUrl, deleteFile };
