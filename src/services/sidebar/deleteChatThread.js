import axios from "axios";
import { authApi } from "../authApi";
import { deleteChatThread } from "@/namespace/server";

export async function deleteChatThreadApi(sessionId) {
    try {
        const res = await authApi(async () => {
            const response = await axios.post(
                deleteChatThread,
                { sessionId },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    },
                }
            );

            return response.data; // ⬅️ Make sure API returns an object with `.success`
        });

        console.log("deleteChatThreadApi response", res);

        if (res.success) {
            return {
                success: true,
                message: "Chat thread deleted successfully.",
            };
        }

        return {
            success: false,
            message: res?.message || "Failed to delete chat thread.",
        };
    } catch (error) {
        throw new Error(
            error?.message || "An error occurred while deleting the chat thread."
        );
    }
}
