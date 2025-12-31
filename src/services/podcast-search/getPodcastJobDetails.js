import { getPodcastJobDetailsUrl } from "@/namespace/server";
import axios from "axios";

export async function getPodcastJobDetails(jobId) {
  try {
    const response = await axios.get(
      getPodcastJobDetailsUrl.replace(":jobId", jobId)
    );

    if (response.data?.data) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    console.error("Error fetching podcast job details:", error);
    throw error;
  }
}
