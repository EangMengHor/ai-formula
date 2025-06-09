import axios from "axios";
import { authApi } from "../authApi";

// Function to get the latest access token
const getLatestAccessToken = () => {
    return localStorage.getItem("accessToken");
};

export async function getUserAutomation() {
    try {
        // The token will be retrieved just before making the API call
        const res = await authApi(() => {
            // Get the latest access token right before the request
            const accessToken = getLatestAccessToken();
            return axios.get(
                `${import.meta.env.VITE_SOCKET_URL}/api/automation/getAutomationByUserId`,
                {
                    withCredentials: true, // Ensures cookies are sent
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${accessToken}`
                    },
                },
            );
        });

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
