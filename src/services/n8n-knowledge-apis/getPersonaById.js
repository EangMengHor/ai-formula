import { response } from "@/lib/utils";
import { getPersonaByIdUrl } from "@/namespace/server";
import axios from "axios";

export async function getPersonaById(id) {
  try {
    const data = await axios.post(getPersonaByIdUrl, {
      id,
    });
    console.log(data, "getPersonaById");
    return data.data;
  } catch (error) {
    return response(false, error.message || "Something went wrong");
  }
}
