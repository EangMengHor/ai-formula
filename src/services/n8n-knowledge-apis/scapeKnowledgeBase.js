import axios from "axios";
import { response } from "../../lib/utils";
import { scrapeKnowledgeBaseUrl } from "../../namespace/server";



// used in knowledge base scrapping section
export async function scrapeKnowledgeBase(searchTerm, personaId) {
    try {
        const res = await axios.post(scrapeKnowledgeBaseUrl, {
            search: searchTerm,
            id: personaId
        });
        if (res.status === 200) {
            return response(true, "Successfully fetched", res.data)
        }
    } catch (error) {
        return response(false, error.message)

    }
}