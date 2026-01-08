import axios from "axios";
import { response } from "@/lib/utils";
import { authApi } from "../authApi";
import {
    startContentTaskUrl,
    pollContentTaskUrl,
    deployToVercelUrl,
} from "@/namespace/server";

/**
 * Start a new content AI task
 * @param {string} sessionId - The chat session ID
 * @param {string} prompt - The user prompt
 * @returns {Promise} Response with taskId and sessionId
 */
export async function startContentTask(sessionId, prompt, prevPrompts = []) {
    try {
        const res = await authApi(async () => {
            const requestData = {
                sessionId,
                prompt,
                prevPrompts,
            };

            const _response = await axios.post(startContentTaskUrl, requestData, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
            return _response.data;
        });

        if (res.success) {
            return response(true, "Task started successfully", res.data);
        }

        return response(false, res.message || "Failed to start task", null);
    } catch (error) {
        console.error("Error starting content task:", error);
        return response(false, error.message || "An error occurred while starting the task", null);
    }
}

/**
 * Poll for content AI task results
 * @param {string} sessionId - The chat session ID
 * @returns {Promise} Response with conversation history and task status
 */
export async function pollContentTask(sessionId) {
    try {
        const res = await authApi(async () => {
            const requestData = {
                sessionId,
            };

            const _response = await axios.post(pollContentTaskUrl, requestData, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
            });
            return _response.data;
        });

        if (res.success !== undefined) {
            return response(true, "Task polled successfully", res);
        }

        return response(false, res.message || "Failed to poll task", null);
    } catch (error) {
        console.error("Error polling content task:", error);
        return response(false, error.message || "An error occurred while polling the task", null);
    }
}

/**
 * Upload file directly to backend
 * @param {File} file - The file to upload
 * @param {string} sessionId - The session ID to associate with the file
 * @param {function} onProgress - Progress callback
 * @returns {Promise} Response indicating success or failure
 */
export async function uploadFileToBackend(file, sessionId, onProgress) {
    try {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable && onProgress) {
                    const progress = Math.round((e.loaded * 100) / e.total);
                    onProgress(progress);
                }
            });

            // Handle completion
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const responseData = JSON.parse(xhr.responseText);
                        resolve(response(true, "File uploaded successfully", responseData));
                    } catch (e) {
                        resolve(response(true, "File uploaded successfully", null));
                    }
                } else {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            });

            // Handle errors
            xhr.addEventListener('error', () => {
                reject(new Error('Network error during upload'));
            });

            xhr.addEventListener('abort', () => {
                reject(new Error('Upload aborted'));
            });

            // Prepare form data
            const formData = new FormData();
            formData.append('data0', file);
            formData.append('sessionId', sessionId);

            // Open connection and send file
            xhr.open('POST', 'https://backend.jamesscott.tech/webhook/upload-file-manus');
            xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem("accessToken")}`);
            xhr.send(formData);
        });
    } catch (error) {
        console.error("Error uploading file to backend:", error);
        return response(false, error.message, null);
    }
}

/**
 * Deploy website to Vercel
 * @param {string} sessionId - The chat session ID
 * @param {string} zipUrl - The URL of the zip file to deploy
 * @param {number} chatIndex - The index of the chat message containing the website
 * @param {string} websiteLink - The preview website link (optional)
 * @returns {Promise} Response with deployment details
 */
export async function publishWebsiteToVercel(sessionId, zipUrl, chatIndex, websiteLink = null) {
    try {
        const res = await authApi(async () => {
            const requestData = {
                sessionId,
                zipUrl,
                chatIndex,
                websiteLink,
            };

            const _response = await axios.post(deployToVercelUrl, requestData, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
                },
                timeout: 300000, // 5 minutes timeout for deployment
            });
            return _response.data;
        });

        if (res.success !== undefined || res.statusCode === 200) {
            return response(true, "Website published successfully", res.data || res);
        }

        return response(false, res.message || "Failed to publish website", null);
    } catch (error) {
        console.error("Error publishing website to Vercel:", error);
        return response(false, error.message || "An error occurred while publishing the website", null);
    }
}
