import fs from "fs";
import path from "path";
import {
  PromptSet,
  PromptVersion,
  PromptType,
  promptTypeToFilename,
} from "@/types/admin-prompts";

const PROMPTS_DIR = path.join(process.cwd(), "admin_data", "prompts");

// Ensure the prompts directory exists when the module loads
if (!fs.existsSync(PROMPTS_DIR)) {
  fs.mkdirSync(PROMPTS_DIR, { recursive: true });
}

function getPromptFilePath(promptType: PromptType): string {
  return path.join(PROMPTS_DIR, promptTypeToFilename[promptType]);
}

/**
 * Reads all prompt versions for a given prompt type.
 */
export function readPromptSet(promptType: PromptType): PromptSet {
  const filePath = getPromptFilePath(promptType);
  try {
    if (!fs.existsSync(filePath)) {
      // If file doesn't exist, initialize with an empty array
      // This case should ideally be handled by initial file creation, but good for safety
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
      return [];
    }
    const fileContent = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(fileContent) as PromptSet;
  } catch (error) {
    console.error(
      `Error reading prompt set for ${promptType} from ${filePath}:`,
      error
    );
    // Return an empty set or re-throw, depending on desired error handling
    // For now, returning empty to prevent crashes, but this indicates a problem.
    return [];
  }
}

/**
 * Writes a full set of prompt versions for a given prompt type.
 */
function writePromptSet(promptType: PromptType, promptSet: PromptSet): void {
  const filePath = getPromptFilePath(promptType);
  try {
    fs.writeFileSync(filePath, JSON.stringify(promptSet, null, 2), "utf-8");
  } catch (error) {
    console.error(
      `Error writing prompt set for ${promptType} to ${filePath}:`,
      error
    );
    // Handle error as appropriate, e.g., throw to signal failure
    throw error;
  }
}

/**
 * Gets the currently active prompt version for a given prompt type.
 */
export function getActivePrompt(promptType: PromptType): PromptVersion | null {
  const promptSet = readPromptSet(promptType);
  const activePrompt = promptSet.find((p) => p.isActive);
  if (!activePrompt && promptSet.length > 0) {
    // Fallback: if no prompt is explicitly active, return the one with the highest version number.
    // This shouldn't happen if new versions correctly set isActive and deactivate others.
    console.warn(
      `No active prompt found for ${promptType}, falling back to latest version.`
    );
    return promptSet.reduce((latest, current) =>
      current.version > latest.version ? current : latest
    );
  }
  if (!activePrompt) {
    console.error(
      `CRITICAL: No prompts found or no active prompt for ${promptType} and no fallback possible.`
    );
    return null; // Or throw an error
  }
  return activePrompt;
}

/**
 * Adds a new prompt version for a given prompt type.
 * Sets the new version as active and deactivates others.
 * Increments version number automatically.
 */
export function addPromptVersion(
  promptType: PromptType,
  content: string,
  changeDescription: string
): PromptVersion {
  const promptSet = readPromptSet(promptType);
  const newVersionNumber =
    promptSet.length > 0 ? Math.max(...promptSet.map((p) => p.version)) + 1 : 1;

  const now = new Date().toISOString();

  const newPromptVersion: PromptVersion = {
    version: newVersionNumber,
    content,
    changeDescription,
    createdAt: now,
    lastModifiedAt: now,
    isActive: true, // New version is active by default
  };

  // Deactivate other versions
  const updatedPromptSet = promptSet.map((p) => ({ ...p, isActive: false }));
  updatedPromptSet.push(newPromptVersion);

  writePromptSet(promptType, updatedPromptSet);
  return newPromptVersion;
}

// Example of how to initialize if files might not exist (run once during setup or on app start):
// Not strictly needed here due to check in readPromptSet, but good for illustration
export function initializePromptFilesIfNotExist(): void {
  Object.values(PromptType).forEach((promptType) => {
    const filePath = getPromptFilePath(promptType as PromptType);
    if (!fs.existsSync(filePath)) {
      console.log(
        `Initializing empty prompt file for ${promptType}: ${filePath}`
      );
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    }
  });
}
