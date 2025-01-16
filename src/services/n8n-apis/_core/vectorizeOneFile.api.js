import axios from "axios";
import { response } from "../../../lib/utils";
import { vectorizeDocument } from "../../../namespace/server";

export async function vectorizeOneFile(data, sessionId) {
    try {
        const formData = new FormData();
        formData.append("data", data);
        formData.append("sessionId", sessionId);

        const _response = await axios.post(vectorizeDocument, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        console.log(_response, "is here in code");
        return response(true, "File Vectorized", _response.data);
    } catch (error) {
        return response(false, error.message, null);
    }
}