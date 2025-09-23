import { getUserEngagementUrl } from "@/namespace/server";
import axios from "axios";

export async function getUserEngagement(userId) {
    try {

        const data = await axios.get(getUserEngagementUrl.replace(':userId', userId));
        console.log("User Engagement Data:", data.data?.data);
        if (!data.data || !data?.data?.statuscode || data.data?.statuscode !== 200) {
            throw new Error('No data found for the given userId');
        }
        return data.data?.data;

    } catch (error) {
        console.error('Error fetching user engagement:', error);
        throw error;
    }
}