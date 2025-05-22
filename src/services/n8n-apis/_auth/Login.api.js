import axios from "axios";
import { response } from "../../../lib/utils";
import { login as loginUrl } from "@/namespace/server";
export async function login(email, password) {
  try {
    console.log(loginUrl, "loginUrl");
    const res = await axios.post(`${loginUrl}`, {
      email,
      password,
    });
    if (res.data[0].error || !res.data[0].success) {
      return response(false, res.data[0].message, res.data[0]);
    }
    console.log(res.data, "res.data");
    return response(true, res.data[0].message, res.data[0]);
  } catch (error) {
    return response(false, error.message, null);
  }
}
