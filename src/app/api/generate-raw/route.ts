import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { GenerateRawRequestSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;

    if (!openRouterApiKey) {
      console.error("OPENROUTER_API_KEY is not set.");
      return NextResponse.json(
        { error: "API key not configured. Please contact support." },
        { status: 500 }
      );
    }

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validatedRequest = GenerateRawRequestSchema.safeParse(requestBody);

    if (!validatedRequest.success) {
      return NextResponse.json(
        {
          error: "Invalid request body for raw generation.",
          details: validatedRequest.error.issues,
        },
        { status: 400 }
      );
    }

    const {
      userNaturalLanguagePrompt,
      selectedTriggerTool,
      selectedProcessLogicTool,
      selectedActionTool,
      selectedLlmModel,
      aiExtractedTrigger,
      aiExtractedProcess,
      aiExtractedAction,
    } = validatedRequest.data;

    const promptFilePath = path.join(
      process.cwd(),
      "prompts",
      "generation",
      "INSTRUCTIONS.md"
    );
    let promptTemplate;
    try {
      promptTemplate = fs.readFileSync(promptFilePath, "utf-8");
    } catch (fileError) {
      console.error("Error reading INSTRUCTIONS.md:", fileError);
      return NextResponse.json(
        { error: "Could not load base prompt instructions." },
        { status: 500 }
      );
    }

    let finalPrompt = promptTemplate;
    finalPrompt = finalPrompt.replace(
      "{{USER_NATURAL_LANGUAGE_PROMPT}}",
      userNaturalLanguagePrompt || ""
    );
    finalPrompt = finalPrompt.replace(
      "{{AI_EXTRACTED_TRIGGER_TEXT}}",
      aiExtractedTrigger || "N/A"
    );
    finalPrompt = finalPrompt.replace(
      "{{AI_EXTRACTED_PROCESS_TEXT}}",
      aiExtractedProcess || "N/A"
    );
    finalPrompt = finalPrompt.replace(
      "{{AI_EXTRACTED_ACTION_TEXT}}",
      aiExtractedAction || "N/A"
    );
    finalPrompt = finalPrompt.replace(
      "{{SELECTED_TRIGGER_TOOL}}",
      selectedTriggerTool || "N/A"
    );
    finalPrompt = finalPrompt.replace(
      "{{SELECTED_PROCESS_LOGIC_TOOL}}",
      selectedProcessLogicTool || "N/A"
    );
    finalPrompt = finalPrompt.replace(
      "{{SELECTED_ACTION_TOOL}}",
      selectedActionTool || "N/A"
    );

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: selectedLlmModel,
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: finalPrompt },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error fetching from OpenRouter" }));
      console.error("OpenRouter API error:", response.status, errorData);
      return NextResponse.json(
        {
          error: `Failed to fetch from LLM: ${response.statusText}`,
          details: errorData,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    const llmOutput =
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content;

    if (!llmOutput) {
      console.error("Unexpected response structure from OpenRouter:", data);
      return NextResponse.json(
        { error: "Unexpected response structure from LLM." },
        { status: 500 }
      );
    }

    return NextResponse.json({ output: llmOutput });
  } catch (error) {
    console.error("Error in /api/generate-raw:", error);
    let errorMessage = "An unexpected error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
