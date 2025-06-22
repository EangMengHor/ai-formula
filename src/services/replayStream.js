import { replayStreamUrl } from "@/namespace/server";

export async function replayStream(sessionId, lastReadIndex) {
    try {
        console.log(sessionId, lastReadIndex, "replayStream called");
        const response = await fetch(replayStreamUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                sessionId: sessionId,
                lastReadedIndex: lastReadIndex - 1,
            }),
        });

        if (!response.ok) {
            let errorMessage = "Failed to replay the stream.";
            try {
                const errorData = await response.json();
                errorMessage = errorData?.message || errorMessage;
            } catch (e) {
                // Ignore JSON parse errors
            }
            throw new Error(errorMessage);
        }
        console.log("Replay stream response 1:", response);
        return response;
    } catch (error) {
        throw new Error(error?.message || "An error occurred while replaying the stream.");
    }
}