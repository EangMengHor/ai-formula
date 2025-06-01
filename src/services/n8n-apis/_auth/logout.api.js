import { response } from "@/lib/utils";
import { logoutUrl } from "@/namespace/server";
import axios from "axios";

export async function logoutApi() {
    try {
        console.log(logoutUrl, "logoutUrl");
        const res = await axios.get(logoutUrl)

        if (res.data.statuscode !== 200) {
            return response(false, res.data.message, null);
        }
        return response(true, res.data.message, null);


    } catch (error) {

        return response(false, error.message, null);

    }
}