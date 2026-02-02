import axios from "axios";
import { response } from "../../lib/utils";

const startJobUrl = `${import.meta.env.VITE_N8N_API_URL}/start-job`;

export async function startWebFrameworkJob(url, userId) {
    try {
        const res = await axios.post(startJobUrl, {
            url: url,
            userId: userId,
        });

        if (res.status !== 200) {
            return response(false, "Failed to start job, please try again!");
        }

        return response(true, "Job started successfully", res.data);
    } catch (error) {
        return response(false, error.message);
    }
}
