import { renameKnowledgeBlockUrl } from "@/namespace/server";
import axios from "axios";

export async function editVectorStoreName(collectionId, userId, newName) {
    try {

        const result = await axios.put(renameKnowledgeBlockUrl.replace(":userId", userId).replace(":collectionId", collectionId), {

            collectionName: newName,
        });

        if (result.data.success) {
            return result.data;
        }

        throw new Error("Failed to rename vector store");


    } catch (error) {

        console.error("Error editing vector store name:", error);
        throw error;

    }
}