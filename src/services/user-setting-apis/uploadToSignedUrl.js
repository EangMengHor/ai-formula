import axios from "axios";
import { response } from "../../lib/utils";
import { uploadPersonalKnowledgeUrl } from "../../namespace/server";

export async function uploadToSignedUrl({
  file,
  signedUrl,
  token,
  contentType,
  userId,
  filePath,
}) {
  try {
    const uploadRes = await axios.put(signedUrl, file, {
      headers: {
        "Content-Type": contentType || file.type,
        "x-amz-meta-token": token,
      },
    });

    if (uploadRes.status !== 200) {
      return response(false, "Failed to upload file");
    }
    console.log(filePath);
    const dbRes = await axios.post(uploadPersonalKnowledgeUrl, {
      userId,
      filePath,
    });

    if (dbRes.status !== 200) {
      return response(false, "File uploaded but failed to save in database");
    }

    return response(true, "File uploaded and saved successfully", {
      ...dbRes.data,
      filePath,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return response(false, error.message);
  }
}

export default { uploadToSignedUrl };
