import axios from "axios";
import { response } from "../../../lib/utils";
import { getUploadedDocumentHistoryUrl } from "../../../namespace/server";

export async function getUploadedDocumentHistory(sessionId) {
    try {
        const _res = await axios.post(getUploadedDocumentHistoryUrl, {
            sessionId: sessionId
        })

        return response(200, "successfully got data", _res.data);
    } catch (error) {
        return response(500, error.message || "Internal Server Error", null);

    }

}