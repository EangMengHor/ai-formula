import axios from "axios"
import { response } from "../../lib/utils"
import { toggleUserPersonalKnowledgeStatusUrl } from "../../namespace/server"

export default async function toggleUserPersonalKnowledgeStatus(userId, toggleValue) {
    try {
        const _res = await axios.post(toggleUserPersonalKnowledgeStatusUrl, {
          userId, toggleValue
        })

        console.log(_res.data);
        if (_res.data.route) {
            return response(true, "Status Updated Successfully", _res.data.route)
        }
        return response(false, "Internal Error", _res.data)
    } catch (error) {
        console.log(error)
        return response(false, error.message)
    }
}