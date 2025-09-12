import { deleteUserPromptUrl } from "@/namespace/server";
import axios from "axios";

export async function deletePrompt({
    id,
    userId
}) {
    try {
        const response = await axios.delete(deleteUserPromptUrl.replace(":promptId", id).replace(":userId", userId));
        if (!response.data?.statuscode || response.data?.statuscode !== 200) {
            throw new Error("Failed to delete prompt");
        }
        return response.data;
    } catch (error) {
        console.error("Error deleting prompt:", error);
        throw new Error("Failed to delete prompt");
    }
}