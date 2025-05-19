import { response } from "@/lib/utils";
import axios from "axios";

export async function downloadPdf({ content, fileName = 'document123.pdf', type = 'pdf' }) {
    try {
        const res = await axios.post(
            `${import.meta.env.VITE_PDFDOWNLOAD_URL}/api/documents/pdf`,
            { content },
            {
                headers: { 'Content-Type': 'application/json' },
                responseType: 'blob',
            }
        );

        // Use the provided fileName or fallback
        const downloadName = fileName.endsWith(`.${type}`) ? fileName : `${fileName}.${type}`;
        const url = window.URL.createObjectURL(res.data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', downloadName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        return response(true, 'PDF downloaded successfully', null);
    } catch (error) {
        console.error('Error downloading PDF:', error);
        return response(false, error.message, null);
    }
}