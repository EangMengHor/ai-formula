import axios from "axios";
import { response } from "../../lib/utils";
import { getUserAgenticAutomationUrl } from "../../namespace/server";

export async function getUserAgenticAutomation(userId) {
  try {
    const res = await axios.post(getUserAgenticAutomationUrl, {
      userId: userId,
    });

    if (res.status !== 200) {
      return response(false, "Can't Fetch Agentic Automation , Try Again!");
    }
    return response(true, "Successfully Fetched Agentic Automation", res.data);
  } catch (error) {
    return response(false, error.message);
  }
}
