const url = import.meta.env.VITE_N8N_API_URL;
const test = import.meta.env.VITE_N8N_TEST_API_URL;
const backendUrl = import.meta.env.VITE_SOCKET_URL;
const migrate = "https://backend.jamesscott.tech/webhook-test";
console.log(url);

// chat interface
export const login = `${url}/login`;
export const signup = `${url}/create-new-user`;
export const getChatSessionHistory = `${url}/get-chat-sessions-history`;
export const getChatSession = `${url}/create-new-chat`;
// production
// export const chat = `${test}/chats-1-1`;
// Development
export const chat = `${url}/chats-1-1-dev`;
// poll output
export const pollChatOutputUrl = `${url}/poll-chat-output`;
export const conversationHistory = `${url}/get-conversation-data`;
export const vectorizeDocument = `${url}/vectorize-documents`;
export const voiceToText = `${url}/voice-to-text`;
export const getUploadedDocumentHistoryUrl = `${url}/get-uploaded-document`;
export const pollStatusUrl = `${url}/get-realtime-poll`;
export const pollInteractionLogsUrl = `${url}/get-interaction-logs`;
export const getPersonaByIdUrl = `${url}/get-persona-response`;
// knowledge base
export const getUserSuperiorPersonaUrl = `${url}/get-user-superior-persona`;
export const createPersonasUrl = `${url}/create-persona-sup`;
export const createPersonaTemplate = `${url}/create-persona-template`;
export const pollCurrLoadingPersonaUrl = `${url}/poll-curr-loading-persona`;
export const getSuperPersonaUrl = `${url}/get-superior-persona`;
// Edit persona APIs
export const saveEditedPersonaUrl = `${url}/save-edited-persoans`;
export const editGeneratedPersonaUrl = `${url}/edit-generated-persona`;
// create knowledge base APIs
export const scrapeKnowledgeBaseUrl = `${url}/scrape-and-knowledge-persona`;
export const pollScapingStatusUrl = `${url}/poll-knowlege-scrape-status`;
export const getKnowledgeBaseSourcesOfPersonasUrl = `${url}/get-knowledge-sources-of-personas`;

// agentic automation
export const createJobUri = `${url}/create-job`;
// break down task
export const breakDownTaskUrl = `${url}/break-down-task`;
export const applyChangesToWorkflowUrl = `${url}/make-changes-to-workflow`;
// get all the automation user have created
export const getUserAgenticAutomationUrl = `${url}/get-user-agentic-automation`;
// get jobs of the agentic automation
export const getJobAutomation = `${url}/get-automation-jobs`;
// get full detail of specific automation agent
export const getAutomationSectionDataUrl = `${url}/get-automation-detail`;
// get details about specific job id all the details about specific job id
export const getJobDetailsUrl = `${url}/get-job-details`;
// gets data about all the agents and their workflow execution with interaction between agents
export const getJobEachAgentResponseUrl = `${url}/get-job-each-agent-responses`;

// prompt enhancer

export const getPromptEnhancerUrl = `${url}/prompt-enhancer`;

// user setting APIs
export const getUserPersonalKnowledgeStatusUrl = `${backendUrl}/api/personalKnowledge/getUserPersonalKnowledgeStatus`;
export const toggleUserPersonalKnowledgeStatusUrl = `${backendUrl}/api/personalKnowledge/toggleUserPersonalKnowledgeStatus`;
export const getUserPersonalProfileUrl = `${backendUrl}/api/personalProfile/getUserPersonalProfile`;
export const getUserPersonalProfileOnStatusUrl = `${backendUrl}/api/personalProfileOn/getUserPersonalProfileOnStatus`;
export const toggleUserPersonalProfileOnStatusUrl = `${backendUrl}/api/personalProfileOn/toggleUserPersonalProfileOnStatus`;

// user saved workflow APIs
export const createUserSavedWorkflowUrl = `${backendUrl}/api/userSavedWorkflow/createUserSavedWorkflow`;
export const getUserSavedWorkflowUrl = `${backendUrl}/api/userSavedWorkflow/getUserSavedWorkflow`;

// user personal knowledge APIs
export const generatePresignedUrl = `${backendUrl}/api/personalKnowledge/generatePresignedUrl`;
export const uploadPersonalKnowledgeUrl = `${backendUrl}/api/personalKnowledge/upload`;
export const getUserPersonalKnowledgeFilesUrl = `${backendUrl}/api/personalKnowledge/files`;

