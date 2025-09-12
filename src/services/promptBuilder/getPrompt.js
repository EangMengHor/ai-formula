import { getUserPromptsUrl } from "@/namespace/server";
import axios from "axios";

export async function getPrompts(userId) {
    try {
        const response = await axios.get(getUserPromptsUrl.replace(":id", userId));
        if (!response.data?.statuscode || response.data?.statuscode !== 200) {
            throw new Error("Failed to fetch prompts");
        }
        return response.data?.data || [];
    } catch (error) {
        console.error("Error fetching prompts:", error);
        throw new Error("Failed to fetch prompts");
    }
}