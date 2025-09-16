import { getEmailOutreachJobDetailsUrl } from "@/namespace/server";

export async function getEmailOutreachJobDetails(jobId) {
    try {
        const response = await axios.get(getEmailOutreachJobDetailsUrl.replace(":jobId", jobId));
        if (response.data?.data) {
            return response.data?.data;
        }
        return null;
    } catch (error) {
        console.error("Error fetching email outreach job details:", error);
        throw error;
    }
}