import axios from "axios";
import { getUrlScrapedUrl } from "@/namespace/server";

export async function getUrlScrapper(jobId) {
    try {
        const url = getUrlScrapedUrl.replace(":id", jobId);
        const response = await axios.get(url);
        if (response.data.success) {
            return response.data.data;
        }
        else {
            return {
                success: false,
                message: response.data.message || "Failed to fetch URL scrapper data"
            };
        }
    } catch (error) {
        console.error("Error fetching URL scrapper data:", error);
        throw error;
    }
}
