import { response } from "@/lib/utils"
import { authApi } from "../authApi"
import axios from "axios"
import { editChatThreadApiUrl } from "@/namespace/server"

export async function updateChatThread(sessionId, newName) {
    try {
        const res = await authApi(
            async function () {
                const data = await axios.post(editChatThreadApiUrl, {
                    sessionId,
                    newChatName: newName
                }, {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
                    }
                });
                if (data && data?.data?.success) {
                    return response(true, "Chat thread updated successfully.", data.data);
                }
                return response(false, data.data.message || "Failed to update chat thread.", null);
            }
        )

        console.log("updateChatThread response", res)
        if (res.success) {
            return response(true, res.message, res.data);
        }
        return response(false, res.message || "Failed to update chat thread.", null);
    } catch (error) {

        console.error(error.message)
        return response(false, error.message, null)

    }
}