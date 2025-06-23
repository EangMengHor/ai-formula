export async function SSEChatCall(payload, refreshAccessToken,) {
    try {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
            console.error("❗ No access token available");
            await refreshAccessToken();
            console.warn("❗ Retrying after refreshing access token");
        }
        let response = await fetch(
            `${import.meta.env.VITE_SOCKET_URL}/api/core/chating`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                credentials: "include",
                body: JSON.stringify(payload),
            },
        );

        // If unauthorized or forbidden, try refreshing token and retrying once
        if (response.status === 401 || response.status === 403) {
            console.warn("❗ Unauthorized or forbidden, refreshing token");
            await refreshAccessToken();
            await new Promise((r) => setTimeout(r, 500)); // 100ms delay
            const accessToken = localStorage.getItem("accessToken");
            if (!accessToken) {
                console.error("❗ No access token available after refresh");
                throw new Error("No access token available after refresh");
            }
            // Retry the request once after token refresh
            response = await fetch(
                `${import.meta.env.VITE_SOCKET_URL}/api/core/chating`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${accessToken}`,
                    },
                    credentials: "include",
                    body: JSON.stringify(payload),
                },
            );
        }

        if (!response.ok || response.status >= 400) {
            const errorText = await response.json();
            throw new Error(`${errorText.errors}`);
        }

        return response;
    } catch (error) {
        console.error("Error in SSEChatCall:", error);
        throw new Error("Can't Connect to the model (Either Your Internet Is Unstable Or Model Is Down). Please Try After Sometime !" || "Unknown SSEChatCall error");
    }
}