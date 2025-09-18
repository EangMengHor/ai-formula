import { storePromptUrl } from "@/namespace/server";
import axios from "axios";

export async function storePrompt({
    json = "",
    prompt = "",
    userId,
    name = "untitled prompt"
}) {
    try {
        const response = await axios.post(storePromptUrl, {
            userId,
            jsonData: json,
            prompt,
            name
        });

        if (!response.data?.statuscode || response.data?.statuscode !== 200) {
            throw new Error("Failed to store prompt");
        }

        return response.data;

    } catch (error) {

        console.error("Error storing prompt:", error);
        throw new Error("Failed to store prompt");
    }
}