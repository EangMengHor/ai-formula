import { searchInternetUrl } from "@/namespace/server";
import axios from "axios";

export async function searchInternet(query) {

    try {

        const data = await axios.post(searchInternetUrl, {
            query
        })


        if (data.status === 200) {
            return data?.data?.data?.searchResults || "No results found for this query";
        }

        throw new Error("Failed to fetch search results");


    } catch (error) {

        throw new Error(error.message);

    }
}