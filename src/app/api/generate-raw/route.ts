import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  GenerateRawRequestSchema,
  type GenerateRawApiResponse,
  GenerateRawApiResponseSchema,
} from "@/lib/validations";

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
    } catch (_parseError) {
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

    const llmApiCall = await fetch(
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
            {
              role: "system",
              content: "You are an AI assistant that only outputs valid JSON.",
            },
            { role: "user", content: finalPrompt },
          ],
          response_format: { type: "json_object" },
        }),
      }
    );

    if (!llmApiCall.ok) {
      const errorData = await llmApiCall
        .json()
        .catch(() => ({ error: "Unknown error from LLM" }));
      console.error(
        "OpenRouter API error (generate-raw):",
        llmApiCall.status,
        errorData
      );
      return NextResponse.json(
        {
          error: `LLM API request failed: ${llmApiCall.statusText}`,
          details: errorData,
        },
        { status: llmApiCall.status }
      );
    }

    const rawLlmResponseData = await llmApiCall.json();
    const llmOutputString = rawLlmResponseData.choices?.[0]?.message?.content;

    let apiResponse: GenerateRawApiResponse;

    if (
      !llmOutputString ||
      typeof llmOutputString !== "string" ||
      llmOutputString.trim() === ""
    ) {
      console.error(
        "LLM did not return expected non-empty JSON string (generate-raw):",
        rawLlmResponseData
      );
      apiResponse = {
        generatedJsonString: llmOutputString || null, // Pass along even if empty/null for context
        isJsonSyntaxValid: false,
        jsonSyntaxErrorMessage:
          "LLM response was empty or not in the expected string format.",
      };
    } else {
      const trimmedLlmOutput = llmOutputString.trim();
      try {
        JSON.parse(trimmedLlmOutput); // Attempt to parse
        apiResponse = {
          generatedJsonString: trimmedLlmOutput,
          isJsonSyntaxValid: true,
          jsonSyntaxErrorMessage: null,
        };
      } catch (e) {
        apiResponse = {
          generatedJsonString: trimmedLlmOutput,
          isJsonSyntaxValid: false,
          jsonSyntaxErrorMessage:
            e instanceof Error ? e.message : "Unknown JSON parsing error.",
        };
        console.error(
          "Error parsing generated JSON from LLM:",
          apiResponse.jsonSyntaxErrorMessage
        );
      }
    }

    return NextResponse.json(apiResponse);
  } catch (error) {
    console.error("Error in /api/generate-raw:", error);
    // For generic server errors, still return a simple error object
    const errorResponse = {
      error:
        error instanceof Error
          ? error.message
          : "An unexpected server error occurred.",
      // Ensure structure matches what tests might expect for general errors, if different from GenerateRawApiResponse
      generatedJsonString: null,
      isJsonSyntaxValid: false,
      jsonSyntaxErrorMessage:
        error instanceof Error
          ? error.message
          : "An unexpected server error occurred.",
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
