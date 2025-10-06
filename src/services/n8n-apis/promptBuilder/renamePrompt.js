import axios from 'axios';

export async function renamePrompt(promptId, userId, newName) {
    try {
        if (!promptId || !userId || !newName) {
            throw new Error('Prompt ID, User ID, and new name are required');
        }

        const response = await axios.post(`${import.meta.env.VITE_SOCKET_URL}/api/prompt-builder/rename-prompt`, {
            promptId,
            userId,
            newName
        });

        // Check for successful response
        if (response.data.statuscode === 200 && response.data.success) {
            return response.data.data; // Return the response data
        } else {
            throw new Error(response.data.message || 'Failed to rename prompt');
        }

    } catch (error) {
        console.error('Error in renamePrompt:', error);
        throw new Error(`Failed to rename prompt: ${error.message}`);
    }
}