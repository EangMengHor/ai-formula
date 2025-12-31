import { getUserPodcastJobsUrl } from "@/namespace/server";
import axios from "axios";

export async function getUserPodcastJobs(userId) {
  try {
    const response = await axios.get(
      getUserPodcastJobsUrl.replace(":userId", userId)
    );

    if (response.data?.data) {
      return response.data.data;
    }

    return [];
  } catch (error) {
    console.error("Error fetching user podcast jobs:", error);
    throw error;
  }
}
