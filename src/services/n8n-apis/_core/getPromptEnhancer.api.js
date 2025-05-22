import { getPromptEnhancerUrl } from "@/namespace/server";
import axios from "axios";

export async function getPromptEnhancerApi(rawPrompt) {
  try {
    const promptEnhancerApi = await axios.post(getPromptEnhancerUrl, {
      prompt: rawPrompt,
    });
    if (promptEnhancerApi.status === 200) {
      console.log("Prompt Enhancer API response:", promptEnhancerApi.enhanced);
      return promptEnhancerApi.data?.enhanced || rawPrompt;
    }

    throw new Error(`Error in Prompt Enhancer`);
  } catch (error) {
    throw new Error(`Error in Prompt Enhancer: ${error.message}`);
  }
}
