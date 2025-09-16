import { activateEmailOutreachModuleUrl } from "@/namespace/server";
import axios from "axios";

export async function activateEmailOutreachModule({
    query = "",
    numberOfArticle = 50,
    senderName = "",
    userId = "",
    freshness = "week",
    pitchDeskPrompt = "",
}) {
    try {
        const response = await axios.post(activateEmailOutreachModuleUrl, {
            query,
            numberOfArticles: numberOfArticle,
            senderName,
            userId,
            freshness,
            pitchDeskPrompt
        });

        if (response.data?.jobId) {
            return response.data?.jobId;
        }
        return null;
    } catch (error) {

        console.error("Error activating email outreach module:", error);
        throw error;
    }
}