import axios from "axios"
import { response } from "../../lib/utils"
import { createPersonasUrl } from "../../namespace/server"

export async function createPersona({ title, description, maxPer,userId }) {
    try {
        const _res = await axios.post(createPersonasUrl, {
            name: title,
            description: description,
            numberOfPersona: maxPer,
            userId:userId
        })

        console.log(_res.data);
        if (_res.data.route) {
            return response(true, "Successfully created ", _res.data.route)
        }
        return response(false, "Internal Error", _res.data)
    } catch (error) {
        console.log(error)
        return response(false, error.message)
    }
}