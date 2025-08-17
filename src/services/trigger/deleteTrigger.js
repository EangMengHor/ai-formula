import { deleteTriggerUrl } from "@/namespace/server";
import axios from "axios";

export async function deleteTrigger(triggerId) {
    try {

        const data = await axios.post(deleteTriggerUrl, {
            triggerId
        })
        return data;

    } catch (error) {

        console.error("Error deleting trigger:", error);
        throw error;
    }
}