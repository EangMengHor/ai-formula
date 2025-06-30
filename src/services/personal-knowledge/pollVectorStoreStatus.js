import { pollVectorStoreScrapperStatusUrl } from "@/namespace/server";
import axios from "axios";

export async function pollVectorStoreStatus(dbId) {
    try {
        // Remove any surrounding quotes from dbId
        const cleanDbId = String(dbId).replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");

        const data = await axios.get(pollVectorStoreScrapperStatusUrl.replace(":id", cleanDbId));

        if (data.status !== 200) {
            return {
                success: false,
                message: "Failed to poll vector store status",
                data: null
            };
        }

        return {
            success: true,
            message: "Successfully polled vector store status",
            data: data.data
        };


    } catch (error) {
        throw new Error(`Error polling vector store status: ${error.message}`);

    }
}