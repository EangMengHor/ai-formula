import { response } from "@/lib/utils";
import { authApi } from "./authApi.js";
import axios from "axios";
import { isRelayMessageUrl } from "@/namespace/server.js";

export async function isReplay(sessionId) {
    try {
        const res = await authApi(
            async function () {
                const data = await axios.post(isRelayMessageUrl, {
                    sessionId: sessionId
                }, {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("accessToken")}`
                    }
                });

                if (data && data?.data?.success) {
                    return response(true, "Replay status checked successfully.", data.data);
                }
                return response(false, data?.data?.message || "Failed to check replay status.", null);
            }
        );

        console.log("isReplay response", res);
        if (res.success) {
            return response(true, res.message, res.data);
        }
        return response(false, res.message || "Failed to check replay status.", null);
    } catch (error) {
        console.error(error.message);
        return response(false, error.message, null);
    }
}
