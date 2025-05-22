import axios from "axios";
import { pollCurrLoadingPersonaUrl } from "../../namespace/server";
import { response } from "../../lib/utils";

export async function pollCurrLoadingPersona(sessionId) {
  try {
    const _res = await axios.post(pollCurrLoadingPersonaUrl, {
      session: sessionId,
    });

    if (_res.status === 200) {
      return response(true, "Successfully fetched", _res.data);
    }
    return response(false, "Internal Error", _res.data);
  } catch (error) {
    console.log(error);
    return response(false, error.message);
  }
}
