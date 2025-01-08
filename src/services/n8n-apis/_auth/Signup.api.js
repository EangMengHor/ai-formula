import axios from "axios";
import { response } from "../../../lib/utils";
import { signup as signupUrl } from '@/namespace/server'

export async function signup(email, password) {
    try {
        const _response = await axios.post(`${signupUrl}`, {
            email, password
        });

        if (_response.data[0].error || !_response.data[0].success) {
            return response(false, _response.data[0].error, null);
        }

        return response(true, _response.data[0].message, _response.data[0]);
    } catch (error) {
        return response(false, error.message, null);

    }
}