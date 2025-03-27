import axios from "axios";
import { response } from "../../lib/utils";
import { breakDownTaskUrl } from "../../namespace/server";

export async function breakDownTask(type, text, data) {
    try {
        const dataToSent = new FormData();
        dataToSent.append("type", type);
        dataToSent.append("data", data);
        dataToSent.append("text", text);
        const res = await axios.post(breakDownTaskUrl, dataToSent, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        if (res.status !== 200) {
            return response(false, res.data.message || "Failed to create break down of the task");
        }
        return response(true, res.data.message || "Task break down successfully created", {
            data: res.data.data,
            parsed: res.data.parsed
        } || []);
    } catch (error) {
        return response(false, error.message);

    }
}