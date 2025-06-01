import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { z } from "zod";
import {
  PromptValidationResponseSchema,
  ClientFacingValidationResponseSchema,
  type ClientFacingValidationResponse,
} from "@/lib/validations";
import {
  triggerTools,
  processLogicTools,
  actionTools,
  getPreselectedTool,
  triggerToolKeywords,
  processLogicToolKeywords,
  actionToolKeywords,
} from "@/lib/toolOptions";

export async function POST(req: NextRequest) {
  try {
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    const validationModel = "openai/gpt-3.5-turbo"; // As decided

    if (!openRouterApiKey) {
      console.error("OPENROUTER_API_KEY is not set for validation.");
      return NextResponse.json(
        { error: "API key not configured. Please contact support." },
        { status: 500 }
      );
    }

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request: Malformed JSON body." },
        { status: 400 }
      );
    }

    const { userPrompt } = requestBody || {};
    const userPromptValue = requestBody?.userPrompt;

    if (typeof userPromptValue !== "string" || userPromptValue.trim() === "") {
      return NextResponse.json(
        { error: "User prompt is required, must be a non-empty string." },
        { status: 400 }
      );
    }

    const promptFilePath = path.join(
      process.cwd(),
      "prompts",
      "validation",
      "TAP_VALIDATION_PROMPT.md"
    );
    let validationPromptTemplate;
    try {
      validationPromptTemplate = fs.readFileSync(promptFilePath, "utf-8");
    } catch (fileError) {
      console.error("Error reading validation prompt file:", fileError);
      return NextResponse.json(
        {
          error:
            "Could not load validation instructions. Please contact support.",
        },
        { status: 500 }
      );
    }

    const filledPrompt = validationPromptTemplate.replace(
      "{{USER_PROMPT}}",
      userPromptValue // Use the validated userPromptValue here
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
          model: validationModel,
          messages: [
            // No separate system prompt needed if the main prompt is comprehensive
            { role: "user", content: filledPrompt },
          ],
          response_format: { type: "json_object" }, // Request JSON output from OpenAI models that support it
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "Unknown error fetching from OpenRouter for validation",
      }));
      console.error(
        "OpenRouter API validation error:",
        response.status,
        errorData
      );
      return NextResponse.json(
        {
          error: `Failed to fetch from LLM for validation: ${response.statusText}`,
          details: errorData,
        },
        { status: response.status }
      );
    }

    const rawLlmResponse = await response.json();
    const llmJsonOutput =
      rawLlmResponse.choices &&
      rawLlmResponse.choices[0] &&
      rawLlmResponse.choices[0].message &&
      rawLlmResponse.choices[0].message.content;

    if (!llmJsonOutput) {
      console.error(
        "Unexpected response structure from OpenRouter (validation):",
        rawLlmResponse
      );
      return NextResponse.json(
        { error: "Unexpected response structure from LLM during validation." },
        { status: 500 }
      );
    }

    let parsedLlmJson;
    try {
      parsedLlmJson = JSON.parse(llmJsonOutput);
    } catch (jsonParseError) {
      console.error(
        "Error parsing LLM JSON response for validation:",
        jsonParseError,
        "Raw output:",
        llmJsonOutput
      );
      return NextResponse.json(
        {
          error: "LLM response for validation was not valid JSON.",
          rawOutput: llmJsonOutput,
        },
        { status: 500 }
      );
    }

    const llmValidationResult =
      PromptValidationResponseSchema.safeParse(parsedLlmJson);

    if (!llmValidationResult.success) {
      console.error(
        "LLM validation response failed Zod parsing:",
        llmValidationResult.error.issues,
        "Parsed LLM JSON:",
        parsedLlmJson
      );
      return NextResponse.json(
        {
          error: "LLM response for validation was not in the expected format.",
          details: llmValidationResult.error.issues,
        },
        { status: 500 }
      );
    }

    // Now, map extracted text to tools using our backend logic
    const matchedTriggerTool = getPreselectedTool(
      triggerTools,
      triggerToolKeywords,
      llmValidationResult.data.trigger
    );
    const matchedProcessTool = getPreselectedTool(
      processLogicTools,
      processLogicToolKeywords,
      llmValidationResult.data.process
    );
    const matchedActionTool = getPreselectedTool(
      actionTools,
      actionToolKeywords,
      llmValidationResult.data.action
    );

    const clientResponse: ClientFacingValidationResponse = {
      valid: llmValidationResult.data.valid,
      extractedTriggerText: llmValidationResult.data.trigger,
      extractedProcessText: llmValidationResult.data.process,
      extractedActionText: llmValidationResult.data.action,
      feedback: llmValidationResult.data.feedback,
      suggestions: llmValidationResult.data.suggestions,
      matchedTriggerTool,
      matchedProcessTool,
      matchedActionTool,
    };

    return NextResponse.json(clientResponse);
  } catch (error) {
    console.error("Error in /api/validate-prompt:", error);
    let errorMessage = "An unexpected error occurred during prompt validation.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
