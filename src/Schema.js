import { z } from "zod";

export const createPersonaFormSchema = z.object({
    title: z.string().min(2, {
        message: "Title must be at least 2 characters.",
    }),
    prompt: z.string().min(10, {
        message: "Prompt must be at least 10 characters.",
    }),
    maxPersonas: z.preprocess((val) => {
        if (typeof val == "string") {
            try {
                const parsed = parseInt(val);
                if (!isNaN(parsed)) {
                    return parsed;
                } else {
                    return val;
                }
            } catch (e) {
                return val
            }
        } else {
            return val
        }
    }, z.number().min(1, {
        message: "Max personas must be at least 1.",
    })),
})
export const createTemplateFormSchema = z.object({
    goal: z.string().min(2, {
        message: "Title must be at least 2 characters.",
    })
})
export const eachPersonaSchema = z.object({
    id: z.number(),
    name: z.string().min(3, "Title is too short"),
    description: z.string().min(50, "Description is too short"),
    knowledgeBaseSearch: z.array(z.string().min(10, "Each knowledge base entry must be at least 10 characters"))
      .min(1, "Knowledge base search is empty or missing"),
    isLiked: z.boolean().optional(),
  });