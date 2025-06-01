import axios from "axios";
import { response } from "../../../lib/utils";
import { login as loginUrl } from "@/namespace/server";

export async function login(email, password) {
  try {
    console.log(loginUrl, "loginUrl");
    const res = await axios.post(
      `${loginUrl}`,
      {
        email,
        password,
      },
      {
        withCredentials: true, // ← tells the browser “store/accept any Set-Cookie”
        headers: { "Content-Type": "application/json" },
      },
    );
    console.log(res.data, "asdasd");
    if (res.data.statuscode !== 200) {
      console.log(res);
      return response(false, res.data.message, null);
    }
    console.log(res.data, "res.data");
    return response(true, res.data.message, res.data);
  } catch (error) {
    return response(false, error.message, null);
  }
}
