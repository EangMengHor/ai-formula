import axios from "axios";
import { authApi } from "../authApi";

export async function getUserAutomation() {
  try {
    const res = await authApi(() =>
      axios.get(
        `${import.meta.env.VITE_SOCKET_URL}/api/automation/getAutomationByUserId`,
        {
          withCredentials: true, // Ensures cookies are sent
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    console.log(res, "getUserAutomation res");
    if (res && res.error) {
      console.error("Error fetching user automation:", res.error);
      return null;
    }
    return res.data;
  } catch (error) {
    console.error("Error in getUserAutomation:", error);
    return null;
  }
}
