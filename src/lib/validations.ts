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

// Schema for /api/generate-raw request body (Sprint 3 & 4 enhanced)
export const GenerateRawRequestSchema = z.object({
  userNaturalLanguagePrompt: z
    .string()
    .min(1, "Natural language prompt cannot be empty."),
  selectedTriggerTool: z.string().min(1, "Trigger tool selection is required."),
  selectedProcessLogicTool: z
    .string()
    .min(1, "Process logic tool selection is required."),
  selectedActionTool: z.string().min(1, "Action tool selection is required."),
  selectedLlmModel: z.string().min(1, "LLM model selection is required."),
  // New fields for Sprint 4 to pass AI extracted texts
  aiExtractedTrigger: z
    .string()
    .nullable()
    .describe("AI extracted trigger text from validation step"),
  aiExtractedProcess: z
    .string()
    .nullable()
    .describe("AI extracted process text from validation step"),
  aiExtractedAction: z
    .string()
    .nullable()
    .describe("AI extracted action text from validation step"),
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

// Schema for the response from /api/generate-raw TO THE CLIENT (Sprint 5 Update)
export const GenerateRawApiResponseSchema = z.object({
  generatedJsonString: z
    .string()
    .nullable()
    .describe("The string from LLM, intended to be n8n JSON workflow."),
  isJsonSyntaxValid: z
    .boolean()
    .describe("True if generatedJsonString was successfully parsed as JSON."),
  jsonSyntaxErrorMessage: z
    .string()
    .nullable()
    .describe("Error message if JSON parsing failed."),
});

export type GenerateRawApiResponse = z.infer<
  typeof GenerateRawApiResponseSchema
>;

// Schema for /api/generate-guide request body (Sprint 6)
export const GenerateGuideRequestSchema = z.object({
  n8nWorkflowJson: z.string().min(1, "n8n workflow JSON cannot be empty."),
  userNaturalLanguagePrompt: z
    .string()
    .min(1, "Natural language prompt cannot be empty."),
  aiExtractedTrigger: z.string().nullable(),
  aiExtractedProcess: z.string().nullable(),
  aiExtractedAction: z.string().nullable(),
  selectedTriggerTool: z.string(),
  selectedProcessLogicTool: z.string(),
  selectedActionTool: z.string(),
  selectedLlmModelForGuide: z
    .string()
    .min(1, "LLM model for guide generation is required."),
});
export type GenerateGuideRequest = z.infer<typeof GenerateGuideRequestSchema>;

// Schema for /api/generate-guide response body (Sprint 6)
export const GenerateGuideApiResponseSchema = z.object({
  instructionalGuideMarkdown: z
    .string()
    .describe("The generated guide in Markdown format."),
});
export type GenerateGuideApiResponse = z.infer<
  typeof GenerateGuideApiResponseSchema
>;
