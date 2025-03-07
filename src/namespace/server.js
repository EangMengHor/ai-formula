const url = import.meta.env.VITE_N8N_API_URL;
const test = import.meta.env.VITE_N8N_TEST_API_URL;
const migrate = 'https://backend.jamesscott.tech/webhook-test'
console.log(url);

// chat interface
export const login = `${url}/login`;
export const signup = `${url}/create-new-user`
export const getChatSessionHistory = `${url}/get-chat-sessions-history`
export const getChatSession = `${url}/create-new-chat`
// production
// export const chat = `${test}/chats-1-1`
// Development 
export const chat = `${url}/chats-1-1-dev`
// poll output 
export const pollChatOutputUrl = `${url}/poll-chat-output`

export const conversationHistory = `${url}/get-conversation-data`
export const vectorizeDocument = `${url}/vectorize-documents`
export const voiceToText = `${url}/voice-to-text`
export const getUploadedDocumentHistoryUrl = `${url}/get-uploaded-document`
export const pollStatusUrl = `${url}/get-realtime-poll`


export const pollInteractionLogsUrl = `${url}/get-interaction-logs`
//  - - - knowledge base - - -
export const getUserSuperiorPersonaUrl = `${url}/get-user-superior-persona`
export const createPersonasUrl = `${url}/create-persona-sup`
export const createPersonaTemplate = `${url}/create-persona-template`
export const pollCurrLoadingPersonaUrl = `${url}/poll-curr-loading-persona`
export const getSuperPersonaUrl = `${url}/get-superior-persona`
// Edit persona APIs
export const saveEditedPersonaUrl = `${url}/save-edited-persoans`
export const editGeneratedPersonaUrl = `${url}/edit-generated-persona`
// create knowledge base APIs
export const scrapeKnowledgeBaseUrl = `${url}/scrape-and-knowledge-persona`;
export const pollScapingStatusUrl = `${url}/poll-knowlege-scrape-status`


