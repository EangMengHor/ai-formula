import { createNewCollectionUrl } from "@/namespace/server";
import axios from "axios";

export async function createNewVectorStore({
    userId,
    vectorStoreName = "Default Vector Store",
}) {
    try {

        const data = await axios.post(createNewCollectionUrl, {
            userId,
            collectionName: vectorStoreName
        })
        if (
            !data || !data.data.success
        ) {
            throw new Error("Failed to create new vector store");
        }

        return data.data;
    } catch (error) {

        console.error("Error creating new vector store:", error);
        throw new Error("Failed to create new vector store");

    }
}