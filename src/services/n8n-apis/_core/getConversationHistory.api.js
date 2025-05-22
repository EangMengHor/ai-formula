import axios from "axios";
import { response } from "../../../lib/utils";
import { conversationHistory } from "../../../namespace/server";

export async function getConversationHistory(sessionId) {
  try {
    const _res = await axios.post(`${conversationHistory}`, {
      sessionId: sessionId,
    });
    if (Object.keys(_res.data).length <= 0) {
      return response(false, "Can't Get chat history", null);
    }
    console.log("Chat History", _res.data[0]);
    return response(true, "Successfully Fetched Chat History", _res.data);
  } catch (error) {
    return response(false, "Can't Get chat history", null);
  }
}
