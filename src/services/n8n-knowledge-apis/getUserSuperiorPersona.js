import axios from "axios";
import { response } from "../../lib/utils";
import { getUserSuperiorPersonaUrl } from "../../namespace/server";

export default async function getUserSuperiorPersona(id) {
  try {
    const res = await axios.post(getUserSuperiorPersonaUrl, {
      id: id,
    });

    if (res.status == 200) {
      return response(true, "Successfully fetched", res.data);
    } else {
      return response(false, "Error fetching superior persona");
    }
  } catch (error) {
    return response(false, error.message);
  }
}
