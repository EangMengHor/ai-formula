import { getJobDetailsUrlX } from "@/namespace/server";
import axios from "axios";

export async function getJobDetails(outputId) {
    try {

        const data = await axios.get(getJobDetailsUrlX.replace(":triggerId", outputId))

        if (!data || data.data?.statuscode !== 200) {
            return null;
        }

        return data.data?.data || null;

    } catch (error) {

        console.error("Error fetching job details:", error);
        throw error;
    }
}