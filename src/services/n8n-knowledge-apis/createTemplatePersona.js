import axios from "axios";
import { createPersonaTemplate } from "../../namespace/server";
import { response } from "../../lib/utils";

export async function createTemplatePersona(goal) {
  try {
    const _res = await axios.post(createPersonaTemplate, {
      q: goal,
    });

    console.log(_res.data);
    if (Array.isArray(_res.data) && _res.data[0] && _res.data[0].output) {
      return response(true, "Successfully created ", _res.data);
    }
    return response(false, "Internal Error", _res.data);
  } catch (error) {
    console.log(error);
    return response(false, error.message);
  }
}
