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
