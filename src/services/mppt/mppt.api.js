import axios from "axios";
import { response } from "@/lib/utils";
import {
    startMpptUrl,
    pollMpptJobUrl,
    vectorizeMpptDocumentsUrl,
    askDecisionAgentUrl,
    getUserDecisionsUrl,
    getMpptChatHistoryUrl,
    getUserMpptJobsUrl,
    getMpptContentToDownloadUrl,
} from "@/namespace/server";

/**
 * Start a new MPPT job
 */
export async function startMpptJob({ prompt, chatMemory = [], userId, sessionId, isInternetSearch = true }) {
    try {
        const res = await axios.post(startMpptUrl, {
            prompt,
            chatMemory,
            userId,
            sessionId,
            isInternetSearch,
        }, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });

        if (res.data.success) {
            return response(true, "MPPT job started successfully", res.data.data);
        }
        return response(false, res.data.message || "Failed to start MPPT job", null);
    } catch (error) {
        console.error("Error starting MPPT job:", error);
        return response(false, error.message || "An error occurred", null);
    }
}

/**
 * Poll an MPPT job by jobId
 */
export async function pollMpptJob(jobId) {
    try {
        const res = await axios.get(`${pollMpptJobUrl}/${jobId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });

        if (res.data.success) {
            return response(true, "Job polled successfully", res.data.data);
        }
        return response(false, res.data.message || "Failed to poll job", null);
    } catch (error) {
        console.error("Error polling MPPT job:", error);
        return response(false, error.message || "An error occurred", null);
    }
}

/**
 * Upload a document for MPPT vectorization
 * Accepts: pdf, csv, xlsx, txt
 */
export async function vectorizeMpptDocument(file, sessionId, onProgress) {
    try {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener("progress", (e) => {
                if (e.lengthComputable && onProgress) {
                    const progress = Math.round((e.loaded * 100) / e.total);
                    onProgress(progress);
                }
            });

            xhr.addEventListener("load", () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const responseData = JSON.parse(xhr.responseText);
                        resolve(response(true, "File uploaded successfully", responseData.data || responseData));
                    } catch (e) {
                        resolve(response(true, "File uploaded successfully", null));
                    }
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            });

            xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
            xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

            const formData = new FormData();
            formData.append("data0", file);
            formData.append("sessionId", sessionId);

            xhr.open("POST", vectorizeMpptDocumentsUrl);
            xhr.setRequestHeader("Authorization", `Bearer ${localStorage.getItem("accessToken")}`);
            xhr.send(formData);
        });
    } catch (error) {
        console.error("Error uploading MPPT document:", error);
        return response(false, error.message, null);
    }
}

/**
 * Stream decision agent responses via SSE
 * Returns the fetch response for caller to handle streaming
 */
export async function streamDecisionAgent({ prompt, chatMemory = [], userId }) {
    const res = await fetch(askDecisionAgentUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ prompt, chatMemory, userId }),
    });
    return res;
}

/**
 * Get paginated decisions for a user
 */
export async function getUserDecisions(userId, page = 1, limit = 10) {
    try {
        const res = await axios.post(getUserDecisionsUrl, { userId, page, limit }, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });

        if (res.data.success) {
            return { ...response(true, "Decisions fetched", res.data.data), pagination: res.data.pagination };
        }
        return response(false, res.data.message || "Failed to fetch decisions", null);
    } catch (error) {
        console.error("Error fetching user decisions:", error);
        return response(false, error.message || "An error occurred", null);
    }
}

/**
 * Get MPPT chat history for a session
 */
export async function getMpptChatHistory(sessionId) {
    try {
        const res = await axios.get(`${getMpptChatHistoryUrl}/${sessionId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });

        if (res.data.success) {
            return response(true, "Chat history fetched", res.data.data);
        }
        return response(false, res.data.message || "Failed to fetch history", null);
    } catch (error) {
        console.error("Error fetching MPPT chat history:", error);
        return response(false, error.message || "An error occurred", null);
    }
}

/**
 * Get content string for a job to be downloaded as PDF
 */
export async function getContentToDownload(jobId) {
    try {
        const res = await axios.post(getMpptContentToDownloadUrl, { jobId }, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });
        return response(true, "Content fetched", res.data);
    } catch (error) {
        console.error("Error fetching content to download:", error);
        return response(false, error.message || "An error occurred", null);
    }
}

/**
 * Get all MPPT jobs for a user
 */
export async function getUserMpptJobs(userId) {
    try {
        const res = await axios.post(getUserMpptJobsUrl, { userId }, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
        });

        if (res.data.success) {
            return response(true, "Jobs fetched", res.data.data);
        }
        return response(false, res.data.message || "Failed to fetch jobs", null);
    } catch (error) {
        console.error("Error fetching user MPPT jobs:", error);
        return response(false, error.message || "An error occurred", null);
    }
}
