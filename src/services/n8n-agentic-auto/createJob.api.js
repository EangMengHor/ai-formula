import axios from "axios";
import { response } from "../../lib/utils";
import { createJobUri } from "../../namespace/server";

export async function createJob(data) {
  try {
    const res = await axios.post(createJobUri, data);
    if (res.status !== 200) {
      return response(false, res.data.message || "something went wrong!");
    }
    return response(true, res.data.message || "Job created successfully!");
  } catch (error) {
    return response(false, error.message || "something went wrong!");
  }
}
