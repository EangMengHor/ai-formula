import axios from "axios";
import { response } from "../../lib/utils";
import { getJobEachAgentResponseUrl } from "../../namespace/server";

export async function getJobEachAgentResponse(jobId) {
    try {
        const res = await axios.post(getJobEachAgentResponseUrl, {
            jobId: jobId
        })
        if (res.status !== 200) {
            return response(false, "Failed to get job each agent response");
        }
        return response(true, 'Success',res.data);
    } catch (error) {
        return response(false, error.message);
    }
}