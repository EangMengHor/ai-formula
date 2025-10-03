import axios from 'axios';

export async function savePrompt(prompt, promptName, format = "normal", templates = []) {
    try {
        const userId = localStorage.getItem("id");

        if (!userId) {
            throw new Error('User ID not found in localStorage');
        }

        if (!prompt || !promptName) {
            throw new Error('Prompt and prompt name are required');
        }

        const response = await axios.post(`${import.meta.env.VITE_SOCKET_URL}/api/prompt-builder/save-prompt`, {
            prompt,
            promptName,
            userId,
            format,
            templates
        });

        // Check for successful response
        if (response.data.statuscode === 200 && response.data.success) {
            return response.data.data; // Return the saved prompt data
        } else {
            throw new Error(response.data.message || 'Failed to save prompt');
        }

    } catch (error) {
        console.error('Error in savePrompt:', error);
        throw new Error(`Failed to save prompt: ${error.message}`);
    }
}