import axios from "axios";
import { response } from "../../../lib/utils";
import { getChatSession as getNewSessionUrl } from "@/namespace/server";
export async function getNewSession(prompt, userId) {
  try {
    const _response = await axios.post(`${getNewSessionUrl}`, {
      prompt,
      userId,
    });
    return response(true, "New Session Created", _response.data[0]);
  } catch (error) {
    return response(false, error.message, null);
  }
}
