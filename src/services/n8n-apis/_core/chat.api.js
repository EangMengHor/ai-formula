import axios from "axios";
import { response } from "../../../lib/utils";
import { chat as url } from '@/namespace/server'
export async function chat(
    prompt,
    sessionId,
    files = [],
    isSearch = false,
    isDocument = false,
    isVectorBase = false,
    module = "question",
    isInteraction = false,
    intraction = "sequential",
    superiorPersonaId = -1
) {
    try {
        const isFiles = files.length > 0;

        const requestData = {
            prompt: prompt,
            sessionId: sessionId,
            isSearch: isSearch,
            isDocument: isDocument,
            isVectorBase: isVectorBase,
            module: module,
            isInteraction: isInteraction,
            intraction: intraction,
            superiorPersonaId: superiorPersonaId
        };
        console.log(requestData, "data123");
        if (isFiles) {
            requestData.data = files;
        }
        const res = await axios.post(url, requestData, {
            timeout: 3000000 // 50 minutes
        });
        console.log(res, 'chat response');
        if (res.status == 200) {
            return response(true, "Chat message sent", res.data.id);
        }
        return response(false, "Chat message not sent", null);


    } catch (error) {
        return response(false, error.message, null);

    }
}