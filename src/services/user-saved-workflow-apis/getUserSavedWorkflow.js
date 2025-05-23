import { getUserSavedWorkflowUrl } from "@/namespace/server";
import axios from "axios";

export async function getUserSavedWorkflow(userId) {
  try {
    const response = await axios.post(getUserSavedWorkflowUrl, {
      userId: userId,
    });
    console.log("User saved workflows:", response.data);
    if (response.status === 200) {
      return response.data;
    } else {
      throw new Error("Failed to fetch user saved workflows");
    }
  } catch (error) {
    console.error("Error fetching user saved workflows:", error);
    throw new Error("Failed to fetch user saved workflows");
  }
}
