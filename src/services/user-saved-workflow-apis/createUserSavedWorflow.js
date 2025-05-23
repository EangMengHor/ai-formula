import axios from "axios";
import { response } from "../../lib/utils";
import { createUserSavedWorkflowUrl } from "../../namespace/server";

export default async function createUserSavedWorflow(workflowData) {
  try {
    const _res = await axios.post(createUserSavedWorkflowUrl, workflowData);
    console.log("User saved workflow response:", _res.data);
    console.log(_res.data);
    if (_res.data) {
      return response(true, "Status Updated Successfully", _res.data);
    }
    return response(false, "Internal Error", _res.data);
  } catch (error) {
    console.log(error);
    return response(false, error.message);
  }
}
