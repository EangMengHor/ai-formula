import { response } from "@/lib/utils";
import { getGeneratedVisualizationUrl } from "@/namespace/server";
import axios from "axios";

export async function getGeneratedVisualization(dataId) {
    try {
        const res = await axios.post(
            getGeneratedVisualizationUrl,
            {
                dataId: dataId,
            }
        )
        if (!res || !res.data || !res.data.success) {
            return response(false, "Failed to fetch visualization data", res.data.message || "Unknown error");
        }
        const visualizationData = res.data.data
        console.log("Visualization Data:", visualizationData);
        return response(true, "Visualization data fetched successfully", visualizationData);
    } catch (error) {


        return response(false, "Failed to fetch visualization data", error.message);

    }
}