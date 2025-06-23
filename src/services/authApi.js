import { refreshApi } from "./n8n-apis/_auth/refresh.api";

export async function authApi(fn) {
    try {
        // First attempt — will throw if 401/403
        return await fn();
    } catch (error) {
        const status = error?.response?.status;

        if (status === 401 || status === 403) {
            console.warn("❗ Unauthorized or forbidden (caught), refreshing token");

            try {
                await refreshApi();
                await new Promise((resolve) => setTimeout(resolve, 300)); // small delay
                return await fn(); // retry after refresh
            } catch (refreshError) {
                return {
                    success: false, 
                    message: "Token refresh failed",
                    data: null,
                };
            }
        }

        return {
            success: false,
            message: error.message || "Unknown error occurred",
            data: null,
        };
    }
}
