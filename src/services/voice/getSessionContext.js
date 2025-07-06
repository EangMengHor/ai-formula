import { getVoiceToVoiceSessionContextUrl } from "@/namespace/server";
import axios from "axios";

export async function getSessionContext(sessionId) {

    try {

        const response = await axios.post(getVoiceToVoiceSessionContextUrl, {
            sessionId: sessionId
        });


        if (response.status === 200) {
            return response.data.data
        }

        throw new Error("Failed to fetch session context");


    } catch (error) {

        throw new Error(error.message);


    }

}
