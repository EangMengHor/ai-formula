import { response } from "@/lib/utils";
import { refreshAccessTokenUrl } from "@/namespace/server";
import axios from "axios";

export async function refreshApi() {
  try {
    const res = await axios.get(refreshAccessTokenUrl, {
      withCredentials: true, // ✅ move it out of headers
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.data.statuscode !== 200) {
      return response(false, res.data.message, null);
    }
    return response(true, res.data.message, res.data);
  } catch (error) {
    return response(false, error.message, null);
  }
}
