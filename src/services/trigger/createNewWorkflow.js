import { createNewWorkflowUrl } from "@/namespace/server";
import axios from "axios";

export async function createNewWorkflow({
    prompt = "",
    outputFormat = "",
    existingWorkflow = []

}) {
    try {
        const data = await axios.post(createNewWorkflowUrl, {
            prompt,
            outputFormat,
            existingWorkflow: JSON.stringify(existingWorkflow)
        })
        if (!data.status === 200) {
            throw new Error("Failed to create new workflow");
        }
        return data?.data.workflow;
    } catch (error) {
        console.error("Error creating new workflow:", error);
        throw error;
    }
}