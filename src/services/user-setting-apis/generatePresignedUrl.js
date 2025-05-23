import axios from "axios";
import { response } from "../../lib/utils";
import { generatePresignedUrl as generatePresignedUrlEndpoint } from "../../namespace/server";

export async function generatePresignedUrl({ userId, fileName, bucketName }) {
  try {
    const res = await axios.post(generatePresignedUrlEndpoint, {
      userId,
      fileName,
      bucketName,
    });

    if (res.status !== 200) {
      return response(false, "Failed to generate presigned URL");
    }

    const { signedUrl, token } = res.data?.data || {};

    if (!signedUrl || !token) {
      return response(false, "Invalid response format from server");
    }

    return response(true, "Successfully generated presigned URL", {
      signedUrl,
      token,
      fileName,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return response(false, error.message);
  }
}

export default { generatePresignedUrl };
