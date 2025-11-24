import { refreshApi } from "../_auth/refresh.api";

export async function cognitiveSearch(prompt) {
    try {
        let accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
            console.error("❗ No access token available");
            await refreshApi();
            accessToken = localStorage.getItem("accessToken");
        }

        const response = await fetch(`${import.meta.env.VITE_SOCKET_URL}/api/search/cognitive-search`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            credentials: "include",
            body: JSON.stringify({ prompt }),
        });

        if (response.status === 401 || response.status === 403) {
            console.warn("❗ Unauthorized or forbidden, refreshing token");
            await refreshApi();
            await new Promise((r) => setTimeout(r, 500));
            accessToken = localStorage.getItem("accessToken");
            if (!accessToken) {
                throw new Error("No access token available after refresh");
            }
            // Retry
            const retryResponse = await fetch(`${import.meta.env.VITE_SOCKET_URL}/api/search/cognitive-search`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                credentials: "include",
                body: JSON.stringify({ prompt }),
            });
            if (!retryResponse.ok) {
                throw new Error(`HTTP ${retryResponse.status}`);
            }
            return retryResponse;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return response;
    } catch (error) {
        console.error("Error in cognitiveSearch:", error);
        throw error;
    }
}