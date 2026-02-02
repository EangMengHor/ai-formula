import axios from "axios";
import { response } from "../../lib/utils";

const getJobStatusUrl = `${import.meta.env.VITE_N8N_API_URL}/get-job-status`;

export async function getWebFrameworkJobStatus(dbId) {
    try {
        const res = await axios.post(getJobStatusUrl, {
            id: parseInt(dbId, 10),
        });

        if (res.status !== 200) {
            return response(false, "Failed to get job status, please try again!");
        }

        return response(true, "Job status fetched successfully", res.data);
    } catch (error) {
        return response(false, error.message);
    }
}
