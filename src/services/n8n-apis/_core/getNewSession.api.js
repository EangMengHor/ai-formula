import axios from "axios";
import { response } from "../../../lib/utils";
import { getChatSession as getNewSessionUrl } from "@/namespace/server";
export async function getNewSession(prompt, userId, sessionId = null) {
    try {
        const requestData = {
            prompt,
            userId,
        };

        // Include sessionId if provided (for client-generated sessions)
        if (sessionId) {
            requestData.sessionId = sessionId;
        }

        const _response = await axios.post(`${getNewSessionUrl}`, requestData);
        return response(true, "New Session Created", _response.data[0]);
    } catch (error) {
        return response(false, error.message, null);
    }
}
