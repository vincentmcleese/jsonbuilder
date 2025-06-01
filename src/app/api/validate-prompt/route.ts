import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { PromptValidationResponseSchema } from "@/lib/validations";

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

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request: Malformed JSON body." },
        { status: 400 }
      );
    }

    const { userPrompt } = body || {}; // Ensure body is not null before destructuring

    // Use a separate variable for the value after checking its existence and type
    const userPromptValue = body?.userPrompt;

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

    try {
      const parsedJson = JSON.parse(llmJsonOutput);
      const validationResult =
        PromptValidationResponseSchema.safeParse(parsedJson);

      if (!validationResult.success) {
        console.error(
          "LLM validation response failed Zod parsing:",
          validationResult.error.issues
        );
        // Potentially return the raw LLM JSON if it was close, or a generic error
        // For now, a generic error to indicate the LLM didn't follow instructions
        return NextResponse.json(
          {
            error:
              "LLM response for validation was not in the expected format.",
            details: validationResult.error.issues,
          },
          { status: 500 }
        );
      }
      return NextResponse.json(validationResult.data);
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
  } catch (error) {
    console.error("Error in /api/validate-prompt:", error);
    let errorMessage = "An unexpected error occurred during prompt validation.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
