import { newOsintInstancePollingUrl } from "@/namespace/server";
import axios from "axios";

export async function pollNewOsintInstanceWorkflow(workflowId) {
    try {
        const response = await axios.get(newOsintInstancePollingUrl.replace(":workflowId", workflowId));
        if (response.status === 200) {
            return response.data?.data || null;
        } else {
            throw new Error(`Failed to poll OSINT instance workflow: ${response.statusText}`);
        }
    } catch (error) {
        console.error("[pollNewOsintInstanceWorkflow] Error polling OSINT instance workflow:", error);
        throw error;
    }
}