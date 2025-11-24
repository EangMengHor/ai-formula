import { refreshApi } from "../_auth/refresh.api";

export async function getPromptById(id) {
    try {
        let accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
            console.error("❗ No access token available");
            await refreshApi();
            accessToken = localStorage.getItem("accessToken");
        }

        const response = await fetch(`${import.meta.env.VITE_SOCKET_URL}/api/search/get-prompt-by-id`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            credentials: "include",
            body: JSON.stringify({ id }),
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
            const retryResponse = await fetch(`${import.meta.env.VITE_SOCKET_URL}/api/search/get-prompt-by-id`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                credentials: "include",
                body: JSON.stringify({ id }),
            });
            if (!retryResponse.ok) {
                const errorData = await retryResponse.json();
                throw new Error(errorData.message || `HTTP ${retryResponse.status}`);
            }
            const data = await retryResponse.json();
            return data;
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error in getPromptById:", error);
        throw error;
    }
}