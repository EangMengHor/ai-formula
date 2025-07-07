import { createVisualizationToolUrl } from "@/namespace/server";
import axios from "axios";

export async function createVisualization(prompt, chartType) {
    try {

        const data = await axios.post(createVisualizationToolUrl, {
            prompt: prompt,
            chartType: chartType
        });

        if (data.data.success) {
            return {
                success: true,
                visualizationData: JSON.stringify(data.data.data, null, 2),
            };
        } else {
            return {
                success: false,
                message: data.data.message || "Failed to create visualization"
            };
        }

    } catch (error) {

        console.error("Error creating visualization:", error);
        return {
            success: false,
            message: "Failed to create visualization"
        };

    }
}