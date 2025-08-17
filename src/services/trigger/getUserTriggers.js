import { getAllUserTriggerUrl } from "@/namespace/server";
import axios from "axios";

export async function getUserTriggers(userId) {
    try {

        const data = await axios.post(getAllUserTriggerUrl, {
            userId: userId
        })

        if (!data || data.data?.statuscode !== 200) {
            return []
        }

        return data.data?.data || [];

    } catch (error) {

        console.error("Error fetching user triggers:", error);
        throw error;

    }
}