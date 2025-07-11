/** @jest-environment node */

import { POST } from "./route";
import { NextRequest } from "next/server";
import { jest } from "@jest/globals";
import fs from "fs";
import { GenerateRawRequest, GenerateRawApiResponse } from "@/lib/validations";
import { PromptSet } from "@/types/admin-prompts";

const mockRequest = (body?: unknown) =>
  ({ json: async () => body } as NextRequest);

const originalEnv = process.env;
let fetchSpy: jest.SpiedFunction<typeof global.fetch>;

const validSprint4RequestBody: GenerateRawRequest = {
  userNaturalLanguagePrompt: "Test user prompt for S4/S5",
  selectedTriggerTool: "Webhook Trigger",
  selectedProcessLogicTool: "Code (Function)",
  selectedActionTool: "Slack (Send Message)",
  selectedLlmModel: "openai/gpt-3.5-turbo",
  aiExtractedTrigger: "AI: when form submitted",
  aiExtractedProcess: "AI: if data is valid",
  aiExtractedAction: "AI: send slack alert",
};

describe("/api/generate-raw API endpoint (Sprint 5 functionality)", () => {
  beforeEach(() => {
    process.env = { ...originalEnv, OPENROUTER_API_KEY: "test-api-key" };

    const mainPromptContent =
      "UserGoal: {{USER_NATURAL_LANGUAGE_PROMPT}}, AITrigger: {{AI_EXTRACTED_TRIGGER_TEXT}}, AIProcess: {{AI_EXTRACTED_PROCESS_TEXT}}, AIAction: {{AI_EXTRACTED_ACTION_TEXT}}, SelTrigger: {{SELECTED_TRIGGER_TOOL}}, SelProcess: {{SELECTED_PROCESS_LOGIC_TOOL}}, SelAction: {{SELECTED_ACTION_TOOL}}, Training: {{TRAINING_DATA}}";
    const mainPromptSet: PromptSet = [
      {
        version: 1,
        content: mainPromptContent,
        changeDescription: "Test main prompt v1",
        createdAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
        isActive: true,
      },
    ];
    const trainingDataPromptSet: PromptSet = [
      {
        version: 1,
        content: "Some mock training data.",
        changeDescription: "Test training data v1",
        createdAt: new Date().toISOString(),
        lastModifiedAt: new Date().toISOString(),
        isActive: true,
      },
    ];

    jest.spyOn(fs, "readFileSync").mockImplementation((pathParam) => {
      const filePathString =
        typeof pathParam === "string" ? pathParam : pathParam.toString();
      if (filePathString.includes("generation_main.json")) {
        return JSON.stringify(mainPromptSet);
      }
      if (filePathString.includes("generation_main_training_data.json")) {
        return JSON.stringify(trainingDataPromptSet);
      }
      // Fallback for any other readFileSync calls if needed, or throw error
      // For safety, to ensure tests don't accidentally pass if an unexpected file is read:
      throw new Error(
        `Unexpected fs.readFileSync call in test: ${filePathString}`
      );
    });

    if (fetchSpy) fetchSpy.mockRestore();
  });

  afterEach(() => {
    if (fetchSpy) fetchSpy.mockRestore();
  });

  afterAll(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it("should successfully split, parse valid JSON, and return GenerateRawApiResponse", async () => {
    const llmMockJsonOnlyOutput = JSON.stringify({
      nodes: [],
      connections: {},
    });

    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: llmMockJsonOnlyOutput } }],
        }),
        { status: 200 }
      )
    );
    const response = await POST(mockRequest(validSprint4RequestBody));
    const data = (await response.json()) as GenerateRawApiResponse;

    expect(response.status).toBe(200);
    expect(data.generatedJsonString).toBe(llmMockJsonOnlyOutput);
    expect(data.isJsonSyntaxValid).toBe(true);
    expect(data.jsonSyntaxErrorMessage).toBeNull();
  });

  it("should handle LLM output with invalid JSON (no separator)", async () => {
    const invalidJsonString = "{ key: value_not_stringified }";
    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: invalidJsonString } }],
        }),
        { status: 200 }
      )
    );
    const response = await POST(mockRequest(validSprint4RequestBody));
    const data = (await response.json()) as GenerateRawApiResponse;

    expect(response.status).toBe(200);
    expect(data.generatedJsonString).toBe(invalidJsonString);
    expect(data.isJsonSyntaxValid).toBe(false);
    expect(data.jsonSyntaxErrorMessage).toMatch(
      /JSON at position|Unexpected token/i
    );
  });

  it("should handle LLM output with separator but invalid JSON part", async () => {
    const invalidJson = "{ key: value_not_stringified }";
    const guide = "Some guide.";
    const llmMockOutputWithSeparator = `${invalidJson}---JSON-GUIDE-SEPARATOR---${guide}`;
    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: llmMockOutputWithSeparator } }],
        }),
        { status: 200 }
      )
    );
    const response = await POST(mockRequest(validSprint4RequestBody));
    const data = (await response.json()) as GenerateRawApiResponse;

    expect(response.status).toBe(200);
    expect(data.generatedJsonString).toBe(llmMockOutputWithSeparator);
    expect(data.isJsonSyntaxValid).toBe(false);
    expect(data.jsonSyntaxErrorMessage).toMatch(
      /JSON at position|Unexpected token/i
    );
  });

  it("should handle empty JSON part before separator", async () => {
    const guide = "Some guide.";
    const llmMockOutputEmptyJson = `   ---JSON-GUIDE-SEPARATOR---${guide}`;
    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: llmMockOutputEmptyJson } }],
        }),
        { status: 200 }
      )
    );
    const response = await POST(mockRequest(validSprint4RequestBody));
    const data = (await response.json()) as GenerateRawApiResponse;
    expect(response.status).toBe(200);
    expect(data.generatedJsonString).toBe(llmMockOutputEmptyJson.trim());
    expect(data.isJsonSyntaxValid).toBe(false);
    expect(data.jsonSyntaxErrorMessage).not.toBeNull();
  });

  it("should return 400 for invalid GenerateRawRequest body (missing selected tool)", async () => {
    const invalidBody = {
      ...validSprint4RequestBody,
      selectedTriggerTool: undefined,
    };
    const response = await POST(
      mockRequest(invalidBody as unknown as GenerateRawRequest)
    );
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Invalid request body for raw generation.");
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

  it("should return 500 if INSTRUCTIONS.md file cannot be read", async () => {
    jest.spyOn(fs, "readFileSync").mockImplementation(() => {
      throw new Error("File read error");
    });
    const response = await POST(mockRequest(validSprint4RequestBody));
    expect(response.status).toBe(500);
    expect(await response.json()).toHaveProperty(
      "error",
      "Main generation instructions template not configured."
    );
  });

  it("should return error on OpenRouter API failure for generate-raw", async () => {
    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "LLM down" }), {
        status: 503,
        statusText: "Service Down",
      })
    );
    const response = await POST(mockRequest(validSprint4RequestBody));
    expect(response.status).toBe(503);
    expect(await response.json()).toHaveProperty(
      "error",
      "LLM API request failed: Service Down"
    );
  });

  it("should return 500 if LLM response content is missing (generate-raw)", async () => {
    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ choices: [{ message: {} }] }), {
        status: 200,
      })
    );
    const response = await POST(mockRequest(validSprint4RequestBody));
    const data = (await response.json()) as GenerateRawApiResponse;
    expect(response.status).toBe(200);
    expect(data.isJsonSyntaxValid).toBe(false);
    expect(data.generatedJsonString).toBeNull();
    expect(data.jsonSyntaxErrorMessage).toBe(
      "LLM response was empty or not in the expected string format."
    );
  });
});
