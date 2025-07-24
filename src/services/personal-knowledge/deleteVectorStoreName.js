import { deleteKnowledgeBlockUrl } from "@/namespace/server";
import axios from "axios";

export async function deleteVectorStoreName(collectionId, userId) {
    try {
        const result = await axios.delete(deleteKnowledgeBlockUrl.replace(":userId", userId).replace(":collectionId", collectionId));

        if (result.data.success) {
            return result.data;
        }

        throw new Error("Failed to delete vector store");

    } catch (error) {
        console.error("Error deleting vector store:", error);
        throw error;
    }
}