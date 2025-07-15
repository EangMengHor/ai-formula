import { verifyAndSuggestUrl } from "@/namespace/server";

export async function   verifyAndSuggestion(content, sessionId, isRealtime) {
    try {
        const response = await fetch(verifyAndSuggestUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content, sessionId, isRealtime }),
        });

        if (!response.ok) {
            throw new Error("Failed to verify and suggest content");
        }

        // For SSE, you may want to return the response body as a stream
        return response;
    } catch (error) {
        console.error("Error in verifyAndSuggestion:", error);
        throw new Error("Failed to verify and suggest content. Please try again later.");
    }
}