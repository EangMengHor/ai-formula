import axios from "axios";
import { response } from "../../lib/utils";
import { toggleUserPersonalProfileOnStatusUrl } from "../../namespace/server";

export default async function toggleUserPersonalProfileOnStatus(
  userId,
  toggleValue,
) {
  try {
    const _res = await axios.post(toggleUserPersonalProfileOnStatusUrl, {
      userId,
      toggleValue,
    });

    console.log(_res.data);
    if (_res.data.route) {
      return response(true, "Status Updated Successfully", _res.data.route);
    }
    return response(false, "Internal Error", _res.data);
  } catch (error) {
    console.log(error);
    return response(false, error.message);
  }
}
