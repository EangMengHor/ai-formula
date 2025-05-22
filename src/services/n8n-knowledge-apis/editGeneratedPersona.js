import axios from "axios";
import { response } from "../../lib/utils";
import { editGeneratedPersonaUrl } from "../../namespace/server";

export default async function editGeneratedPersona({
  persona,
  fieldToEdit,
  prompt,
}) {
  try {
    console.log(persona, fieldToEdit, prompt, "is params");
    const _res = await axios.post(editGeneratedPersonaUrl, {
      persona,
      fieldToEdit,
      prompt,
    });

    console.log(_res.data);
    if (_res.data) {
      return response(true, "Successfully created ", _res.data);
    }
    return response(false, "Internal Error", _res.data);
  } catch (error) {
    console.log(error);
    return response(false, error.message);
  }
}
