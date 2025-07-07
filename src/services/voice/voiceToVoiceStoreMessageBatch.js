import { voiceToVoiceStoreMessageBatchUrl } from "@/namespace/server"
import axios from "axios"

export async function voiceToVoiceStoreMessageBatch(sessionId, messageBatch) {
    console.log(sessionId, messageBatch, "is chat history")
    try {
        const dbStore = await axios.post(voiceToVoiceStoreMessageBatchUrl, {
            sessionId: sessionId,
            messageChunks: messageBatch
        })
        if (dbStore) {
            return true
        }
        return false
    } catch (error) {
        throw new Error(error.message)
    }
}