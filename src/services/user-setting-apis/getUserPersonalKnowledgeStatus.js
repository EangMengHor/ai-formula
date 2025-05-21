import axios from "axios"
import { getUserPersonalKnowledgeStatusUrl } from "../../namespace/server"
import { response } from "../../lib/utils";

export default async function getUserPersonalKnowledgeStatus(userId) {
    try {
        const res = await axios.post(getUserPersonalKnowledgeStatusUrl, {
            userId
        });

        return response(true, "Successfully fetched", res.data[0]);
    } catch (error) {
        console.log(error)
        return response(false, error.message)

    }
}