import axios from "axios";
import { response } from "../../lib/utils";
import { createUserSavedWorkflowUrl } from "../../namespace/server";

export default async function createUserSavedWorflow(workflowData) {
  try {
    const _res = await axios.post(createUserSavedWorkflowUrl, workflowData);

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
