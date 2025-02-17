import axios from "axios"
import { getSuperPersonaUrl } from "../../namespace/server"
import { response } from "../../lib/utils";

export default async function getSuperPersona(id) {
    try {
        const res = await axios.post(getSuperPersonaUrl, {
            id
        });

        return response(true, "Successfully fetched", res.data[0]);
    } catch (error) {
        console.log(error)
        return response(false, error.message)

    }
}