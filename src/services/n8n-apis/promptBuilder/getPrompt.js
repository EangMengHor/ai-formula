import axios from 'axios';

export async function getPrompt() {
    try {
        const userId = localStorage.getItem("id");

        if (!userId) {
            throw new Error('User ID not found in localStorage');
        }

        const response = await axios.post(`${import.meta.env.VITE_SOCKET_URL}/api/prompt-builder/get-prompt`, {
            userId
        });

        // Check for successful response
        if (response.data.statuscode === 200 && response.data.success) {
            return response.data.data; // Return the prompts array
        } else {
            throw new Error(response.data.message || 'Failed to fetch prompts');
        }

    } catch (error) {
        console.error('Error in getPrompt:', error);
        throw new Error(`Failed to fetch prompts: ${error.message}`);
    }
}