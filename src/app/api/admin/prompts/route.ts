import { NextRequest, NextResponse } from "next/server";
import {
  PromptType,
  promptTypeToFilename,
  promptVariables,
  PromptVersion,
} from "@/types/admin-prompts";
import { readPromptSet } from "@/lib/admin-prompt-utils";

// For MVP, no server-side session check. Relies on client already being authenticated.
// In a real app, this route would also be protected.

interface AdminPromptResponseEntry {
  displayName: string;
  type: PromptType;
  filename: string;
  versions: PromptVersion[];
  availableVariables: string[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  try {
    const responseData: Record<string, AdminPromptResponseEntry> = {};

    for (const type of Object.values(PromptType)) {
      const typedPromptType = type as PromptType;
      const filename = promptTypeToFilename[typedPromptType];
      responseData[typedPromptType] = {
        displayName: typedPromptType
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()), // e.g., "Validation", "Generation Main"
        type: typedPromptType,
        filename: filename,
        versions: readPromptSet(typedPromptType),
        availableVariables: promptVariables[typedPromptType] || [],
      };
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching prompts for admin:", error);
    return NextResponse.json(
      { error: "Failed to load prompts." },
      { status: 500 }
    );
  }
}
