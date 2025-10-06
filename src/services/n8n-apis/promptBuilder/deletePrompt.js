import axios from 'axios';

export async function deletePrompt(promptId, userId) {
    try {
        if (!promptId || !userId) {
            throw new Error('Prompt ID and User ID are required');
        }

        const response = await axios.post(`${import.meta.env.VITE_SOCKET_URL}/api/prompt-builder/delete-prompt`, {
            promptId,
            userId
        });

        // Check for successful response
        if (response.data.statuscode === 200 && response.data.success) {
            return response.data.data; // Return the response data
        } else {
            throw new Error(response.data.message || 'Failed to delete prompt');
        }

    } catch (error) {
        console.error('Error in deletePrompt:', error);
        throw new Error(`Failed to delete prompt: ${error.message}`);
    }
}