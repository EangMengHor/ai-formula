import axios from "axios";
import { response } from "../../../lib/utils";
import { pollInteractionLogsUrl } from "../../../namespace/server";

export async function pollInteractionLogs(id){
    try {
        const res = await axios.post(pollInteractionLogsUrl,{
            id:String(id)
        })

        return response(true, "success", res.data);
    } catch (error) {
        return response(false, error.message);
        
    }
}