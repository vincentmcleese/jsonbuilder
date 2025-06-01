import { NextRequest, NextResponse } from "next/server";
import { GenerateGuideRequestSchema } from "@/lib/validations";
import { getActivePrompt } from "@/lib/admin-prompt-utils";
import { PromptType } from "@/types/admin-prompts";

export async function POST(req: NextRequest) {
  try {
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      return NextResponse.json(
        { error: "API key not configured." },
        { status: 500 }
      );
    }

    let requestBody;
    try {
      requestBody = await req.json();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      return NextResponse.json(
        { error: "Invalid JSON body for guide generation." },
        { status: 400 }
      );
    }

    const validatedRequest = GenerateGuideRequestSchema.safeParse(requestBody);
    if (!validatedRequest.success) {
      return NextResponse.json(
        {
          error: "Invalid request body for guide generation.",
          details: validatedRequest.error.issues,
        },
        { status: 400 }
      );
    }

    const {
      n8nWorkflowJson,
      userNaturalLanguagePrompt,
      aiExtractedTrigger,
      aiExtractedProcess,
      aiExtractedAction,
      selectedTriggerTool,
      selectedProcessLogicTool,
      selectedActionTool,
      selectedLlmModelForGuide,
    } = validatedRequest.data;

    const activeGuidePrompt = getActivePrompt(PromptType.GenerationGuide);
    if (!activeGuidePrompt || !activeGuidePrompt.content) {
      console.error(
        "CRITICAL: No active guide generation prompt found or content is empty."
      );
      return NextResponse.json(
        {
          error:
            "Guide generation instructions not configured. Please contact support.",
        },
        { status: 500 }
      );
    }
    console.log(
      `Using guide generation prompt version: ${activeGuidePrompt.version}`
    );
    const promptTemplate = activeGuidePrompt.content;

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
    finalPrompt = finalPrompt.replace(
      "{{N8N_WORKFLOW_JSON}}",
      n8nWorkflowJson || "{}"
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
          model: selectedLlmModelForGuide,
          messages: [{ role: "user", content: finalPrompt }],
          // No specific response_format needed, expecting Markdown text
        }),
      }
    );

    if (!llmApiCall.ok) {
      const errorData = await llmApiCall
        .json()
        .catch(() => ({ error: "Unknown error from LLM for guide" }));
      return NextResponse.json(
        {
          error: `LLM guide generation request failed: ${llmApiCall.statusText}`,
          details: errorData,
        },
        { status: llmApiCall.status }
      );
    }

    const llmResponseData = await llmApiCall.json();
    const guideMarkdown = llmResponseData.choices?.[0]?.message?.content;

    if (!guideMarkdown || typeof guideMarkdown !== "string") {
      return NextResponse.json(
        { error: "LLM response for guide was empty or not in string format." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      instructionalGuideMarkdown: guideMarkdown.trim(),
    });
  } catch (error) {
    console.error("Error in /api/generate-guide:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error during guide generation.",
      },
      { status: 500 }
    );
  }
}
