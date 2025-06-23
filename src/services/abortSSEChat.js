import { abortConversation } from "@/namespace/server";
import axios from "axios";
import { authApi } from "./authApi";
import { response } from "@/lib/utils";

export async function abortSSEChat(conversationId) {
    try {

        const res = await authApi(
            async function () {
                const resp = await axios.post(abortConversation, {
                    conversationId: conversationId
                }, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                    }
                });

                if (resp.data && resp.data.success) {
                    return response(200, "Chat session aborted successfully.", resp.data);
                }

                return response(500, resp.data.message || "Failed to abort chat session.", null);
            }
        )

        console.log("abortSSEChat response", res);
        if (res.success) {
            return response(200, res.message, res.data);
        }
        return response(500, res.message || "Failed to abort chat session.", null);


    } catch (error) {

        console.error("Error aborting SSE chat:", error);
        throw new Error("Failed to abort the chat session.");

    }
}