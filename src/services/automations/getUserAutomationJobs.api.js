import axios from "axios";
import { authApi } from "../authApi";

// Function to get the latest access token
const getLatestAccessToken = () => {
    return localStorage.getItem("accessToken");
};

export async function getUserAutomationJobs() {
    try {
        // The token will be retrieved just before making the API call
        const res = await authApi(() => {
            // Get the latest access token right before the request
            const accessToken = getLatestAccessToken();
            console.log(accessToken, "is caceasfda")
            return axios.get(
                `${import.meta.env.VITE_SOCKET_URL}/api/automation/getAllJobsByUserId`,
                {
                    withCredentials: true, // Ensures cookies are sent
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,

                    },
                },
            );
        });

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
