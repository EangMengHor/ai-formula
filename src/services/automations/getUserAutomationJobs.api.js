import axios from "axios";
import { authApi } from "../authApi";

export async function getUserAutomationJobs() {
  try {
    const res = await authApi(() =>
      axios.get(
        `${import.meta.env.VITE_SOCKET_URL}/api/automation/getAllJobsByUserId`,
        {
          withCredentials: true, // Ensures cookies are sent
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    console.log(res, "getUserAutomationJobs res");
    if (res && res.error) {
      console.error("Error fetching user automation jobs:", res.error);
      return null;
    }
    return res.data;
  } catch (error) {
    console.error("Error in getUserAutomationJobs:", error);
    return null;
  }
}
