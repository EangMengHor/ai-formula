import { saveUnconditionalWorkflowUrl } from "@/namespace/server";
import axios from "axios";

export async function createNewUnconditionalTrigger({
    prompt,
    type,
    outputFormat,
    userId,
    frequency,
    times,
    weekDays,
    monthDays,
    timezone,
    isAgentInvokation,
    email,
}) {
    try {

        const data = await axios.post(saveUnconditionalWorkflowUrl, {
            prompt,
            type,
            outputFormat,
            userId,
            frequency,
            times,
            weekDays,
            monthDays,
            timezone,
            isAgentInvokation,
            email,
        });


        return data?.data?.data;
    } catch (error) {

        console.error("Error creating new unconditional trigger:", error);
        throw error;
    }
}