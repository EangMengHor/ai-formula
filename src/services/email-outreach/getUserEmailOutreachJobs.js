import { getUserEmailOutreachJobsUrl } from "@/namespace/server";
import axios from "axios";

export async function getUserEmailOutreachJobs(userId) {
    try {

        const response = await axios.get(getUserEmailOutreachJobsUrl.replace(":userId", userId));
        if (response.data?.data) {
            return response.data?.data;
        }
        return [];
    } catch (error) {
        console.error("Error fetching user email outreach jobs:", error);
        throw error;

    }
}