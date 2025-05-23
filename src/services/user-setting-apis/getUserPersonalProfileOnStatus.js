import axios from "axios";
import { getUserPersonalProfileOnStatusUrl } from "../../namespace/server";
import { response } from "../../lib/utils";

export default async function getUserPersonalProfileOnStatus(userId) {
  try {
    debugger;
    const res = await axios.post(getUserPersonalProfileOnStatusUrl, {
      userId,
    });

    return response(true, "Successfully fetched", res.data.data);
  } catch (error) {
    console.log(error);
    return response(false, error.message);
  }
}
