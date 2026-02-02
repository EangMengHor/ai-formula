import axios from "axios";
import { response } from "../../lib/utils";

const getJobStatusUrl = `${import.meta.env.VITE_N8N_API_URL}/get-user-website-skeleton`;

export async function getUserWebFrameworkJobs(userId) {
    try {
        // This API uses the same endpoint as job status polling
        // Pass userId to get all jobs for this user
        const res = await axios.post(getJobStatusUrl, {
            userId: userId,
        });

        if (res.status !== 200) {
            return response(false, "Failed to fetch jobs, please try again!");
        }

        // If res.data is an array, return it directly
        // If it's a single job object, wrap it in an array
        const jobs = Array.isArray(res.data) ? res.data : res.data ? [res.data] : [];

        return response(true, "Jobs fetched successfully", jobs);
    } catch (error) {
        return response(false, error.message);
    }
}
