const url = import.meta.env.VITE_N8N_API_URL;
const test = import.meta.env.VITE_N8N_TEST_API_URL;
console.log(url);

// chat interface
export const login = `${url}/login`;
export const signup = `${url}/create-new-user`
export const getChatSessionHistory = `${url}/get-chat-sessions-history`
export const getChatSession = `${url}/create-new-chat`
export const chat = `${url}/chats-1-1`
export const conversationHistory = `${url}/get-conversation-data`
export const vectorizeDocument = `${url}/vectorize-documents`
export const voiceToText = `${url}/voice-to-text`
export const getUploadedDocumentHistoryUrl = `${url}/get-uploaded-document`
export const pollStatusUrl = `${url}/get-realtime-poll`



// knowledge base
export const createPersonasUrl = `${test}/create-persona-sup`
export const createPersonaTemplate = `${url}/create-persona-template`
export const pollCurrLoadingPersonaUrl = `${url}/poll-curr-loading-persona`