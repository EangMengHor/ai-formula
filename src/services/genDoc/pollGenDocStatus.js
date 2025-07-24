import axios from "axios";
import { genDocUrl } from "../../namespace/server";

export async function pollGenDocStatus(id) {
    try {

        const response = await axios.get(`${genDocUrl.replace(':id', id)}`);

        if (response.data.success) {
            return {
                success: true,
                message: "Document generation status fetched successfully",
                data: response.data.data
            };
        }
        else {
            console.error("Failed to fetch document generation status:", response.data.message);
        }

        return { success: false, message: "Failed to poll document generation status", data: null };
    } catch (error) {

        console.error("Error polling document generation status:", error);
        return { success: false, message: error.message, data: null };

    }


}