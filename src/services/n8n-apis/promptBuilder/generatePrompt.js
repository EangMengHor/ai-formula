export async function generatePrompt(input, oldPrompt = "", templates = [], format = "normal", onChunk) {
    try {
        const response = await fetch(`${import.meta.env.VITE_SOCKET_URL}/api/prompt-builder/new-prompt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                input,
                oldPrompt,
                templates,
                format
            })
        });

        // Check if response is JSON (error response)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'API request failed');
        }

        // Check for HTTP errors
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Handle SSE response
        if (!response.body) {
            throw new Error('Response body is not readable');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedResponse = '';

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    break;
                }

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6); // Remove 'data: ' prefix

                        if (data === '[DONE]') {
                            // Stream is complete
                            return accumulatedResponse;
                        }

                        // Accumulate the response
                        accumulatedResponse += data;

                        // Call the callback with the new chunk if provided
                        if (onChunk && typeof onChunk === 'function') {
                            onChunk(data, accumulatedResponse);
                        }
                    }
                }
            }

            return accumulatedResponse;
        } finally {
            reader.releaseLock();
        }

    } catch (error) {
        console.error('Error in generatePrompt:', error);
        throw new Error(`Failed to generate prompt: ${error.message}`);
    }
}