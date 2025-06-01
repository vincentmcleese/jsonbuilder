import { z } from "zod";

// Example Zod schema
export const ExampleSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." }),
  email: z.string().email({ message: "Invalid email address." }),
});

export type Example = z.infer<typeof ExampleSchema>;

// Schema for AI Prompt Validation Response (Sprint 2)
export const PromptValidationResponseSchema = z.object({
  valid: z.boolean(),
  trigger: z.string().nullable(),
  process: z.string().nullable(),
  action: z.string().nullable(),
  feedback: z.string().nullable(),
  suggestions: z.array(z.string()).nullable(), // Nullable because the prompt says empty array if valid
});

export type PromptValidationResponse = z.infer<
  typeof PromptValidationResponseSchema
>;
