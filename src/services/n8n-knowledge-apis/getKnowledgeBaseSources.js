import axios from "axios";
import { response } from "../../lib/utils";
import { getKnowledgeBaseSourcesOfPersonasUrl } from "../../namespace/server";

export async function getKnowledgeBaseSourcesOfPersonas(sessionId) {
    try {
        const res = await axios.post(getKnowledgeBaseSourcesOfPersonasUrl, {
            route: sessionId
        })
        if (res.status !== 200) {
            return response(false, res.data.message)
        }
        return response(true, "Success", res.data);
    } catch (error) {
        return response(false, error.message)

    }
}