import axios from "axios";
import { response } from "../../../lib/utils";
import { chat as url } from '@/namespace/server'
export async function chat(prompt, sessionId, files = []) {
    try {
        const isFiles = files.length > 0;

        const requestData = {
            prompt: prompt,
            sessionId: sessionId
        };
        if (isFiles) {
            requestData.data = files;
        }
        const res = await axios.post(url, requestData);
        console.log(res, 'chat response');
        return response(true, "Chat message sent", res.data[0].output);
    } catch (error) {
        return response(false, error.message, null);

    }
}