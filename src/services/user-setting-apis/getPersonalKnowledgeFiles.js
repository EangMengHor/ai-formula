import axios from "axios";
import { response } from "../../lib/utils";
import { getUserPersonalKnowledgeFilesUrl } from "../../namespace/server";

export async function getPersonalKnowledgeFiles(userId) {
  try {
    const res = await axios.get(
      `${getUserPersonalKnowledgeFilesUrl}/${userId}`,
    );

    if (res.status !== 200) {
      return response(false, "Failed to fetch personal knowledge files");
    }

    return response(
      true,
      "Successfully fetched personal knowledge files",
      res.data.data,
    );
  } catch (error) {
    console.error("Error fetching personal knowledge files:", error);
    return response(false, error.message);
  }
}

export default { getPersonalKnowledgeFiles };
