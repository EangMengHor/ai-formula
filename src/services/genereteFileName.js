import { generateFileNameUrl } from "@/namespace/server";
import axios from "axios";

export async function generateFileName(fileContent) {
    try {

        const res = await axios.post(generateFileNameUrl, {
            content: fileContent.slice(0, 1000), // Limit to first 1000 characters
        })

        if (res.data.success) {
            return {
                success: true,
                fileName: res?.data?.data?.filename || "generated_file",
            };
        } else {
            return {
                success: false,
                message: res.data.message || "Failed to generate file name"
            };
        }


    } catch (error) {

        console.error("Error generating file name:", error);
        return {
            success: false,
            message: "Failed to generate file name"
        };

    }

}