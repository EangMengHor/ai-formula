import { saveConditionalWorkflowUrl } from "@/namespace/server";
import axios from "axios";

export async function createNewConditionalTrigger({
    workflow,
    prompt,
    outputFormat,
    userId,
    email
}) {
    try {
        const response = await axios.post(saveConditionalWorkflowUrl, {
            workflow,
            prompt,
            outputFormat,
            userId,
            email,
            type: "conditional"
        });
        return response.data?.data;
    } catch (error) {
        console.error("Error creating new conditional trigger:", error);
        throw error;
    }
}