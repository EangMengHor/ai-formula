import axios from "axios"
import { getUserPersonalProfileUrl } from "../../namespace/server"
import { response } from "../../lib/utils";

export default async function getUserPersonalProfile(userId) {
    try {
        const res = await axios.post(getUserPersonalProfileUrl, {
            userId
        });

        return response(true, "Successfully fetched", res.data.data);
    } catch (error) {
        console.log(error)
        return response(false, error.message)

    }
}