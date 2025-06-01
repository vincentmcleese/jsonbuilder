import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    const hardcodedModel = "openai/gpt-3.5-turbo";

    if (!openRouterApiKey) {
      console.error("OPENROUTER_API_KEY is not set.");
      return NextResponse.json(
        { error: "API key not configured. Please contact support." },
        { status: 500 }
      );
    }

    // Construct the path to the prompt file
    const promptFilePath = path.join(
      process.cwd(),
      "prompts",
      "generation",
      "INSTRUCTIONS.md"
    );
    let promptContent;
    try {
      promptContent = fs.readFileSync(promptFilePath, "utf-8");
    } catch (fileError) {
      console.error("Error reading prompt file:", fileError);
      return NextResponse.json(
        {
          error: "Could not load prompt instructions. Please contact support.",
        },
        { status: 500 }
      );
    }

    // For Sprint 1, user_input is part of the INSTRUCTIONS.md or not used directly
    // const { userInput } = await req.json(); // Will be used in later sprints

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: hardcodedModel,
          messages: [
            { role: "system", content: "You are a helpful assistant." }, // System prompt can be refined
            { role: "user", content: promptContent },
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

    // Assuming the response structure from OpenRouter has choices[0].message.content
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
