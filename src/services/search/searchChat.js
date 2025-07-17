import { searchChatThreadUrl } from "@/namespace/server";
import axios from "axios";

export async function searchChat(searchQuery, userId) {
    try {
        const response = await axios.post(searchChatThreadUrl, {
            userId,
            searchQuery
        });
        if (response.status === 200) {
            return response.data.data || [];
        }
        throw new Error("Failed to search chat threads");
    } catch (error) {
        console.error("Error searching chat:", error);
        throw error;
    }
}