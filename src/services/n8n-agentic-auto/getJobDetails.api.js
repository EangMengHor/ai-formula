import axios from "axios";
import { response } from "../../lib/utils";
import { getJobDetailsUrl } from "../../namespace/server";

export async function getJobDetails(jobId) {
    try {
        const res = await axios.post(getJobDetailsUrl, {
            jobId: jobId
        })
        if (res.status !== 200) {
            return response(false, "Something Went Wrong!");
        }
        if(res.data.length <= 0){
            return response(false, "No Data Found!");
        }
        return response(true, "Data Loaded Successfully!", res.data[0])
    } catch (error) {
        return response(false, error.message || "Something Went Wrong!");
    }
}