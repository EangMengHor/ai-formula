import { getAllJobsUrls } from "@/namespace/server";
import axios from "axios";

export async function getAllJobs(userId) {
    try {

        const data = await axios.post(getAllJobsUrls, {
            userId
        })

        if (!data || data.data?.statuscode !== 200) {
            return [];
        }

        return data.data?.data || [];

    } catch (error) {

        console.error("Error fetching all jobs:", error);
        throw error;
    }
}