const url = import.meta.env.VITE_N8N_API_URL;
console.log(url);
export const login = `${url}/login`;
export const signup = `${url}/create-new-user`
export const getChatSessionHistory = `${url}/get-chat-sessions-history`
export const getChatSession = `${url}/create-new-chat`
export const chat = `${url}/chats`
export const conversationHistory = `${url}/get-conversation-data`
export const vectorizeDocument = `${url}/vectorize-documents`