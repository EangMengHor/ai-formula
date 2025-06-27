/**
 * Uploads a file to a collection with progress tracking
 * @param {FormData} formData - Form data containing file and metadata
 * @param {Function} onProgress - Progress callback function
 * @param {AbortSignal} signal - AbortController signal for cancellation
 * @returns {Promise<Object>} - Response from server
 */
export async function uploadFileToCollection(formData, onProgress, signal) {
    const url = `/api/upload-to-collection`;

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                if (onProgress) onProgress(percentComplete);
            }
        });

        // Handle response
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch (error) {
                    resolve({ success: true });
                }
            } else {
                reject(new Error(`HTTP Error: ${xhr.status}`));
            }
        });

        // Error handling
        xhr.addEventListener('error', () => {
            reject(new Error('Network error occurred'));
        });

        xhr.addEventListener('timeout', () => {
            reject(new Error('Request timed out'));
        });

        xhr.addEventListener('abort', () => {
            reject(new Error('Upload aborted'));
        });

        // Set up request
        xhr.open('POST', url);

        // Connect abort signal if provided
        if (signal) {
            signal.addEventListener('abort', () => {
                xhr.abort();
            });
        }

        // Send the request
        xhr.send(formData);
    });
}
