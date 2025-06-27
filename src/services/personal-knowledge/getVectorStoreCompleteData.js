import { getVectorStoreCompleteDataUrl } from "@/namespace/server";
import axios from "axios";

export async function getVectorStoreCompleteData(collectionId) {

    try {

        const data = await axios.get(`${getVectorStoreCompleteDataUrl.replace(":id", collectionId)}`);

        if (data.status !== 200) {
            return {
                success: false,
                message: "Failed to fetch vector store complete data",
                data: null
            };
        }

        return {
            success: true,
            message: "Successfully fetched vector store complete data",
            data: data.data
        };
    } catch (error) {

        console.error("Error fetching vector store complete data:", error);
        return {
            success: false,
            message: error.message,
            data: null
        };

    }
}