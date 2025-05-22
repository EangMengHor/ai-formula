import axios from "axios";
import { response } from "../../../lib/utils";
import { pollStatusUrl } from "../../../namespace/server";

export async function pollStatus(sessionId) {
  console.log("polling status");
  try {
    const res = await axios.post(pollStatusUrl, {
      sessionId: sessionId,
    });

    return response(true, "Status fetched", res.data);
  } catch (error) {
    return response(false, error.message, null);
  }
}
