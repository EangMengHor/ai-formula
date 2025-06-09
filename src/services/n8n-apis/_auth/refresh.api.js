import { response } from "@/lib/utils";
import { refreshAccessTokenUrl } from "@/namespace/server";
import axios from "axios";

export async function refreshApi() {
    const refreshToken = localStorage.getItem("refreshToken"); // specify the key
    if (!refreshToken) {
        return response(false, "Refresh token is required", null);
    }
    try {
        const res = await axios.post(
            refreshAccessTokenUrl,
            { refreshToken }, // pass refreshToken in body
            {
                withCredentials: true,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );

        if (res.data.statuscode !== 200) {
            return response(false, res.data.message, null);
        }


        console.log(res.data, 'aasdas')
        localStorage.setItem("accessToken", res.data.data.accessToken)
        localStorage.setItem("refreshToken", res.data.data.refreshToken)

        return response(true, res.data.message, res.data);
    } catch (error) {
        return response(false, error.message, null);
    }
}
