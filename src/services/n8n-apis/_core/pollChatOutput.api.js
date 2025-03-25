import axios from "axios";
import { response } from "../../../lib/utils";
import { pollChatOutputUrl } from "../../../namespace/server";

export async function pollChatOutput(id) {
    try {
        const idInt = Number(id);
        const res = await axios.post(pollChatOutputUrl, {
            id: idInt
        });

        // get output condition
        console.log(res,"is here ")
        if (res.status == 200 && res.data.length > 0) {
            return response(true, "Output fetched", res.data[0].output);
        }

        // not yet output 
        if (res.status == 200 && res.data.length == 0) {
            return response(true, "No output yet", null);
        }
    } catch (error) {
        return response(false, error.message, null);

    }
}