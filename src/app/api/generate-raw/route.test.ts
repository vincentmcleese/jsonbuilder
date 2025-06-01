/** @jest-environment node */

import { POST } from "./route";
import { NextRequest } from "next/server";
import { jest } from "@jest/globals";
import fs from "fs";
import { GenerateRawRequest } from "@/lib/validations";

const mockRequest = (body?: any) => ({ json: async () => body } as NextRequest);

const originalEnv = process.env;
let fetchSpy: jest.SpiedFunction<typeof global.fetch>;

const validSprint4RequestBody: GenerateRawRequest = {
  userNaturalLanguagePrompt: "Test user prompt for S4",
  selectedTriggerTool: "Webhook Trigger",
  selectedProcessLogicTool: "Code (Function)",
  selectedActionTool: "Slack (Send Message)",
  selectedLlmModel: "openai/gpt-3.5-turbo",
  aiExtractedTrigger: "AI: when form submitted by user for survey",
  aiExtractedProcess: "AI: filter for priority items only",
  aiExtractedAction: "AI: send urgent notification to slack general channel",
};

describe("/api/generate-raw API endpoint (Sprint 4 functionality)", () => {
  beforeEach(() => {
    process.env = { ...originalEnv, OPENROUTER_API_KEY: "test-api-key" };
    jest
      .spyOn(fs, "readFileSync")
      .mockReturnValue(
        "UserGoal: {{USER_NATURAL_LANGUAGE_PROMPT}}, AITrigger: {{AI_EXTRACTED_TRIGGER_TEXT}}, AIProcess: {{AI_EXTRACTED_PROCESS_TEXT}}, AIAction: {{AI_EXTRACTED_ACTION_TEXT}}, SelTrigger: {{SELECTED_TRIGGER_TOOL}}, SelProcess: {{SELECTED_PROCESS_LOGIC_TOOL}}, SelAction: {{SELECTED_ACTION_TOOL}}"
      );
    if (fetchSpy) fetchSpy.mockRestore();
  });

  afterEach(() => {
    if (fetchSpy) fetchSpy.mockRestore();
  });

  afterAll(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it("should use selectedLlmModel and construct final prompt with all inputs, returning LLM output", async () => {
    const mockLlmOutput =
      "workflow_json---JSON-GUIDE-SEPARATOR---guide_markdown";
    fetchSpy = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: mockLlmOutput } }],
          }),
          { status: 200 }
        )
      );

    const response = await POST(mockRequest(validSprint4RequestBody));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.output).toBe(mockLlmOutput);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const fetchOptions = fetchSpy.mock.calls[0][1] as RequestInit;
    const bodySent = JSON.parse(fetchOptions.body as string);
    const finalPromptSent = bodySent.messages[1].content; // User message

    expect(bodySent.model).toBe(validSprint4RequestBody.selectedLlmModel);
    expect(finalPromptSent).toContain(
      `UserGoal: ${validSprint4RequestBody.userNaturalLanguagePrompt}`
    );
    expect(finalPromptSent).toContain(
      `AITrigger: ${validSprint4RequestBody.aiExtractedTrigger}`
    );
    expect(finalPromptSent).toContain(
      `AIProcess: ${validSprint4RequestBody.aiExtractedProcess}`
    );
    expect(finalPromptSent).toContain(
      `AIAction: ${validSprint4RequestBody.aiExtractedAction}`
    );
    expect(finalPromptSent).toContain(
      `SelTrigger: ${validSprint4RequestBody.selectedTriggerTool}`
    );
    expect(finalPromptSent).toContain(
      `SelProcess: ${validSprint4RequestBody.selectedProcessLogicTool}`
    );
    expect(finalPromptSent).toContain(
      `SelAction: ${validSprint4RequestBody.selectedActionTool}`
    );
  });

  it("should return 400 for invalid request body (e.g., missing selected tool)", async () => {
    const invalidBody = {
      ...validSprint4RequestBody,
      selectedTriggerTool: undefined,
    };
    const response = await POST(mockRequest(invalidBody as any));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Invalid request body for raw generation.");
    expect(data.details).toBeDefined(); // Zod issues
  });

  it("should return 500 if OPENROUTER_API_KEY is not set", async () => {
    delete process.env.OPENROUTER_API_KEY;
    const response = await POST(mockRequest(validSprint4RequestBody));
    expect(response.status).toBe(500);
    expect(await response.json()).toHaveProperty(
      "error",
      "API key not configured. Please contact support."
    );
  });

  it("should return 500 if prompt file cannot be read", async () => {
    jest.spyOn(fs, "readFileSync").mockImplementation(() => {
      throw new Error("File read error");
    });
    const response = await POST(mockRequest(validSprint4RequestBody));
    expect(response.status).toBe(500);
    expect(await response.json()).toHaveProperty(
      "error",
      "Could not load base prompt instructions."
    );
  });

  it("should return error on OpenRouter API failure", async () => {
    fetchSpy = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "bad model" }), {
          status: 500,
          statusText: "Server Error",
        })
      );
    const response = await POST(mockRequest(validSprint4RequestBody));
    expect(response.status).toBe(500);
    expect(await response.json()).toHaveProperty(
      "error",
      "Failed to fetch from LLM: Server Error"
    );
  });

  it("should return 500 if OpenRouter response is missing expected structure", async () => {
    fetchSpy = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ unexpected_data: true }), { status: 200 })
      );
    const response = await POST(mockRequest(validSprint4RequestBody));
    expect(response.status).toBe(500);
    expect(await response.json()).toHaveProperty(
      "error",
      "Unexpected response structure from LLM."
    );
  });
});
