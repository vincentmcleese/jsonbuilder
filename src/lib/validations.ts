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

// Schema for /api/generate-raw request body (Sprint 3)
export const GenerateRawRequestSchema = z.object({
  userNaturalLanguagePrompt: z
    .string()
    .min(1, "Natural language prompt cannot be empty."),
  selectedTriggerTool: z.string().min(1, "Trigger tool selection is required."),
  selectedProcessLogicTool: z
    .string()
    .min(1, "Process logic tool selection is required."), // Single selection for MVP
  selectedActionTool: z.string().min(1, "Action tool selection is required."), // Single selection for MVP
  selectedLlmModel: z.string().min(1, "LLM model selection is required."),
  // No separate version, as it's part of the model ID
});

export type GenerateRawRequest = z.infer<typeof GenerateRawRequestSchema>;

// Schema for the response from /api/validate-prompt TO THE CLIENT (Sprint 3 enhanced)
export const ClientFacingValidationResponseSchema = z.object({
  // Fields from the LLM's validation (kept from PromptValidationResponseSchema)
  valid: z.boolean(),
  // Renaming for clarity on the client that these are the raw extracted texts
  extractedTriggerText: z
    .string()
    .nullable()
    .describe("Raw trigger text extracted by LLM"),
  extractedProcessText: z
    .string()
    .nullable()
    .describe("Raw process text extracted by LLM"),
  extractedActionText: z
    .string()
    .nullable()
    .describe("Raw action text extracted by LLM"),
  feedback: z.string().nullable(),
  suggestions: z.array(z.string()).nullable(),
  // Fields added by our backend after matching with getPreselectedTool
  matchedTriggerTool: z
    .string()
    .nullable()
    .describe("Tool name from our list, or null if no good match"),
  matchedProcessTool: z
    .string()
    .nullable()
    .describe("Tool name from our list, or null if no good match"),
  matchedActionTool: z
    .string()
    .nullable()
    .describe("Tool name from our list, or null if no good match"),
});

export type ClientFacingValidationResponse = z.infer<
  typeof ClientFacingValidationResponseSchema
>;
