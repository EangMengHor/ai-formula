import axios from "axios";

export async function extractText(file) {
    try {
        const formData = new FormData();
        formData.append("data0", file);

        const res = await axios.post(
            `${import.meta.env.VITE_N8N_API_URL}/prompt-template-file-upload`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        // Assuming the API returns the extracted text
        return res.data.text || res.data.extractedText || res.data;
    } catch (error) {
        throw new Error("Failed to extract text from the file: " + error.message);
    }
}