import { searchFileUrl } from "@/namespace/server";
import axios from "axios";

export async function readFileContext(query, fileNameSpace) {

    try {
        const data = await axios.post(searchFileUrl, {
            "query": query,
            "namespace": fileNameSpace,
        })

        if (data.status === 200) {
            return data?.data?.data?.fileData || "No results found for this query";
        }

        throw new Error("Failed to fetch file data");

    } catch (error) {

        throw new Error(error.message);

    }

}