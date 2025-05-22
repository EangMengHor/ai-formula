import axios from "axios";
import { getAutomationSectionDataUrl } from "../../namespace/server";
import { response } from "../../lib/utils";

export async function getAutomationSectionData(automationId) {
  try {
    const res = await axios.post(getAutomationSectionDataUrl, {
      automationId,
    });
    console.log(res, "res");
    if (res.status !== 200) {
      return response(false, "something went wrong after getting data !");
    }
    return response(true, "Data Loaded Successfully!", res.data[0]);
  } catch (error) {
    console.error(error);
    return response(false, error.message);
  }
}
