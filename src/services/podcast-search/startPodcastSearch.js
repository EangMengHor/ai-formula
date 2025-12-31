import { startPodcastSearchUrl } from "@/namespace/server";
import axios from "axios";

export async function startPodcastSearch({
  query = "",
  numberOfArticles = 10,
  freshness = "week",
  userId = ""
}) {
  try {
    const response = await axios.post(startPodcastSearchUrl, {
      query,
      numberOfArticles,
      freshness,
      userId
    });

    if (response.data?.data?.jobId) {
      return response.data.data.jobId;
    }

    return null;
  } catch (error) {
    console.error("Error starting podcast search:", error);
    throw error;
  }
}
