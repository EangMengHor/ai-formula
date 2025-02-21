import axios from "axios";
import { response } from "../../lib/utils";
import { pollScapingStatusUrl } from "../../namespace/server";

export async function pollScapingStatus(id) {
    try {
        const intId = parseInt(id)

        const res = await axios.post(pollScapingStatusUrl, {
            id: intId
        })
        if (res.status == 200) {
            return response(true, "Successfully created knowledge", res.data)
        }
    } catch (error) {
        return response(false, error.message)
    }
}