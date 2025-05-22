import axios from "axios";
import { response } from "../../lib/utils";
import { getJobAutomation } from "../../namespace/server";

export async function getAutomationJobsById(id) {
  try {
    const res = await axios.post(getJobAutomation, {
      automationId: id,
    });
    if (res.status !== 200) {
      return response(false, "something went wrong after getting data !");
    }

    return response(true, "Data Loaded Successfully!", res.data);
  } catch (error) {
    console.error(error);
    return response(false, error.message);
  }
}
