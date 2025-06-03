import { getJobDataByIdUrl } from "@/namespace/server";
import axios from "axios";

export async function getJobDataById(jobId) {
  try {
    const res = await axios.post(
      getJobDataByIdUrl,
      {
        jobId: jobId,
      },
      {
        withCredentials: true, // Ensures cookies are sent
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    console.log(res, "getJobDataById res");
    if (res && res.data && res.data.error) {
      console.error("Error fetching job data by ID:", res.data.error);
      return null;
    }

    return res.data;
  } catch (error) {
    console.error("Error in getJobDataById:", error);
    return null;
  }
}
