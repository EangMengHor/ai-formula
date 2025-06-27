import axios from "axios";
import { response } from "../../../lib/utils";
import { vectorizeDocument } from "../../../namespace/server";

export async function vectorizeOneFile(data, sessionId, type = "chat") {
    try {
        console.clear()
        console.log("my file loader", data)

        // Create FormData and append the actual file
        const formData = new FormData();

        // Extract the actual File object - looking at the console output, 
        // the file is either directly in data or in data.file
        const fileToUpload = data.file || data;

        formData.append("data", fileToUpload);
        formData.append("sessionId", sessionId);
        formData.append("type", type);

        const _response = await axios.post(vectorizeDocument, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        console.log(_response, "is here in code");
        return response(true, "File Vectorized", _response.data);
    } catch (error) {
        return response(false, error.message, null);
    }
}

