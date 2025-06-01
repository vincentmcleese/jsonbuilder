export interface PromptVersion {
  version: number;
  content: string;
  changeDescription: string;
  createdAt: string; // ISO Date string
  lastModifiedAt: string; // ISO Date string
  isActive: boolean;
}

// Represents the content of a single JSON file, e.g., validation.json
export type PromptSet = PromptVersion[];

// Defines the types of prompts we manage
export enum PromptType {
  Validation = "validation",
  GenerationMain = "generation_main",
  GenerationGuide = "generation_guide",
  GenerationMainTrainingData = "generation_main_training_data",
}

// Maps PromptType to its corresponding filename
export const promptTypeToFilename: Record<PromptType, string> = {
  [PromptType.Validation]: "validation.json",
  [PromptType.GenerationMain]: "generation_main.json",
  [PromptType.GenerationGuide]: "generation_guide.json",
  [PromptType.GenerationMainTrainingData]: "generation_main_training_data.json",
};

// Defines the available template variables for each prompt type
export const promptVariables: Record<PromptType, string[]> = {
  [PromptType.Validation]: ["{{USER_PROMPT}}"],
  [PromptType.GenerationMain]: [
    "{{USER_NATURAL_LANGUAGE_PROMPT}}",
    "{{AI_EXTRACTED_TRIGGER_TEXT}}",
    "{{AI_EXTRACTED_PROCESS_TEXT}}",
    "{{AI_EXTRACTED_ACTION_TEXT}}",
    "{{SELECTED_TRIGGER_TOOL}}",
    "{{SELECTED_PROCESS_LOGIC_TOOL}}",
    "{{SELECTED_ACTION_TOOL}}",
    "{{TRAINING_DATA}}",
  ],
  [PromptType.GenerationGuide]: [
    "{{USER_NATURAL_LANGUAGE_PROMPT}}",
    "{{AI_EXTRACTED_TRIGGER_TEXT}}",
    "{{AI_EXTRACTED_PROCESS_TEXT}}",
    "{{AI_EXTRACTED_ACTION_TEXT}}",
    "{{SELECTED_TRIGGER_TOOL}}",
    "{{SELECTED_PROCESS_LOGIC_TOOL}}",
    "{{SELECTED_ACTION_TOOL}}",
    "{{N8N_WORKFLOW_JSON}}",
  ],
  [PromptType.GenerationMainTrainingData]: [],
};
