import { triggerDashboardRecommendationUrl } from "@/namespace/server";
import axios from "axios";

export async function getDashboardTrigger(userId) {
    try {

        const data = await axios.post(triggerDashboardRecommendationUrl, {
            userId
        })


        if (!data || data.data?.statuscode !== 200) {
            return [];
        }

        return data.data?.data || [];

    } catch (error) {

        console.error("Error fetching dashboard trigger:", error);
        throw error;
    }
}