import { getJobEngagementUrl } from "@/namespace/server";
import axios from "axios";

export async function getJobEngagement(jobId) {
    try {

        const response = await axios.get(getJobEngagementUrl.replace(':jobId', jobId));

        if (!response.data || !response?.data.statuscode || response.data.statuscode !== 200) {
            throw new Error('No data found for the given jobId');
        }

        return response.data?.data || null;

    } catch (error) {

        console.error('Error fetching job engagement:', error);
        throw error;

    }
}