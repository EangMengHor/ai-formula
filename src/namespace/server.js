const url = import.meta.env.VITE_N8N_API_URL;
const test = import.meta.env.VITE_N8N_TEST_API_URL;
const backendUrl = import.meta.env.VITE_SOCKET_URL;

const migrate = "https://backend.jamesscott.tech/webhook-test";

// chat interface
export const login = `${backendUrl}/api/auth/login`;
export const logoutUrl = `${backendUrl}/api/auth/logout`;
export const refreshAccessTokenUrl = `${backendUrl}/api/auth/refresh`;
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

// Personal knowledge collections
export const getUserPersonalKnowledgeCollectionUrl = `${backendUrl}/api/personalKnowledge/collection/:userId`;
export const createNewCollectionUrl = `${backendUrl}/api/personalKnowledge/createUserPersonalKnowledge`;
// user saved workflow APIs
// n8n
export const createUserSavedWorkflowUrl = `${url}/create-new-workflow`;
export const getUserSavedWorkflowUrl = `${backendUrl}/api/userSavedWorkflow/getUserSavedWorkflow`;

// user personal knowledge APIs
export const generatePresignedUrl = `${backendUrl}/api/personalKnowledge/generatePresignedUrl`;
export const uploadPersonalKnowledgeUrl = `${backendUrl}/api/personalKnowledge/upload`;
export const getUserPersonalKnowledgeFilesUrl = `${backendUrl}/api/personalKnowledge/files`;

export const getJobDataByIdUrl = `${import.meta.env.VITE_SOCKET_URL}/api/automation/getJobById`;

// is file password correct
export const isFilePasswordCorrectUrl = `${url}/isFilePasswordCorrect`;

export const deleteChatThread = `${import.meta.env.VITE_SOCKET_URL}/api/sidebar/deleteChatThread`;

export const editChatThreadApiUrl = `${import.meta.env.VITE_SOCKET_URL}/api/sidebar/updateChatThreadName`;

export const abortConversation = `${import.meta.env.VITE_SOCKET_URL}/api/core/stopChating`;
export const isRelayMessageUrl = `${import.meta.env.VITE_SOCKET_URL}/api/core/isReplayMessage`;

export const replayStreamUrl = `${import.meta.env.VITE_SOCKET_URL}/api/core/replayContinueStream`;

export const getGeneratedVisualizationUrl = `${import.meta.env.VITE_SOCKET_URL}/api/utils/getDataVisualizationData`;

export const getVectorStoreCompleteDataUrl = `${import.meta.env.VITE_SOCKET_URL}/api/personalKnowledge/getVectorStoreData/:id`;
export const getUrlScrapedUrl = `${import.meta.env.VITE_SOCKET_URL}/api/urlScraper/getUrlScraper/:id`;
export const pollVectorStoreScrapperStatusUrl = `${import.meta.env.VITE_SOCKET_URL}/api/personalKnowledge/progress-update-knowledge/:id`;


export const newOsintInstancePollingUrl = `${import.meta.env.VITE_SOCKET_URL}/api/osint/getNewOsintInstanceWorkflowUpdate/:workflowId`;

export const voiceToVoiceStoreMessageBatchUrl = `${import.meta.env.VITE_SOCKET_URL}/api/voiceToVoice/storeMessageChunks`;

export const getVoiceToVoiceSessionContextUrl = `${import.meta.env.VITE_SOCKET_URL}/api/voiceToVoice/getSessionContext`;

export const getVectorStoredataUrl = `${import.meta.env.VITE_SOCKET_URL}/api/voiceToVoice/getVectorStoreData`;

export const searchInternetUrl = `${import.meta.env.VITE_SOCKET_URL}/api/voiceToVoice/searchInternet`;

export const searchFileUrl = `${import.meta.env.VITE_SOCKET_URL}/api/voiceToVoice/readFile`;

export const generateFileNameUrl = `${import.meta.env.VITE_SOCKET_URL}/api/utils/autoName`;

export const createVisualizationToolUrl = `${import.meta.env.VITE_SOCKET_URL}/api/voiceToVoice/createVisualization  `;

export const verifyAndSuggestUrl = `${import.meta.env.VITE_SOCKET_URL}/api/verify/verify`;

export const searchChatThreadUrl = `${import.meta.env.VITE_SOCKET_URL}/api/search/searchChats`;

export const genDocUrl = `${import.meta.env.VITE_SOCKET_URL}/api/genDoc/status/:id`;
export const renameKnowledgeBlockUrl = `${import.meta.env.VITE_SOCKET_URL}/api/personalKnowledge/updateUserPersonalKnowledge/:collectionId/:userId`;

export const deleteKnowledgeBlockUrl = `${import.meta.env.VITE_SOCKET_URL}/api/personalKnowledge/deleteUserPersonalKnowledge/:collectionId/:userId`;


// financial feed
export const financialFeedUrl = `${import.meta.env.VITE_SOCKET_URL}/finance/poll`;

// trigger
export const createNewWorkflowUrl = `${import.meta.env.VITE_SOCKET_URL}/api/triggers/createNewWorkflow`;

export const saveConditionalWorkflowUrl = `${import.meta.env.VITE_SOCKET_URL}/api/triggers/storeConditionalTrigger`;

export const saveUnconditionalWorkflowUrl = `${import.meta.env.VITE_SOCKET_URL}/api/triggers/storeUnconditionalTrigger`;

export const getAllUserTriggerUrl = `${import.meta.env.VITE_SOCKET_URL}/api/triggers/getUserTriggers`;
export const getJobDetailsUrlX = `${import.meta.env.VITE_SOCKET_URL}/api/triggers/getTriggerJobDataById/:triggerId`;
export const getAllJobsUrls = `${import.meta.env.VITE_SOCKET_URL}/api/triggers/getAllJobData`;
export const deleteTriggerUrl = `${import.meta.env.VITE_SOCKET_URL}/api/triggers/deleteTrigger`;
export const triggerDashboardRecommendationUrl = `${import.meta.env.VITE_SOCKET_URL}/api/triggers/getRecommendedTriggers`;

// prompt buildert
export const storePromptUrl = `${import.meta.env.VITE_SOCKET_URL}/api/promptBuilder/savePrompt`;
export const getUserPromptsUrl = `${import.meta.env.VITE_SOCKET_URL}/api/promptBuilder/getPrompts/:id`;
export const deleteUserPromptUrl = `${import.meta.env.VITE_SOCKET_URL}/api/promptBuilder/deletePrompt/:promptId/:userId`;

// email out reach
export const activateEmailOutreachModuleUrl = `${import.meta.env.VITE_SOCKET_URL}/api/email-outreach/start-email-outreach-module`;
export const getUserEmailOutreachJobsUrl = `${import.meta.env.VITE_SOCKET_URL}/api/email-outreach/getUserEmailJobs/:userId`;
export const getEmailOutreachJobDetailsUrl = `${import.meta.env.VITE_SOCKET_URL}/api/email-outreach/getEmailJobDetails/:jobId`;