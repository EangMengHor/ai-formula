import { getVectorStoredataUrl } from "@/namespace/server";
import axios from "axios";

export async function vectorStoreContext(frameworkName) {


    try {

        const data = await axios.post(getVectorStoredataUrl, {
            frameworkName: frameworkName
        });

        if (data.status === 200) {
            return data?.data?.data.vectorResults || "nothing here found for this framework";
        }

        throw new Error("Failed to fetch vector store data");




    } catch (error) {

        throw new Error(error.message);

    }
}