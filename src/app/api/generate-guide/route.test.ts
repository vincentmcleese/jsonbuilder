/** @jest-environment node */

import { POST } from "./route";
import { NextRequest } from "next/server";
import { jest } from "@jest/globals";
import fs from "fs";
import type { GenerateGuideRequest } from "@/lib/validations";

const mockRequest = (body?: unknown) =>
  ({ json: async () => body } as NextRequest);
const originalEnv = process.env;
let fetchSpy: jest.SpiedFunction<typeof global.fetch>;

const validGuideRequestBody: GenerateGuideRequest = {
  n8nWorkflowJson: JSON.stringify({ nodes: [], connections: {} }),
  userNaturalLanguagePrompt: "Test user prompt",
  aiExtractedTrigger: "AI trigger text",
  aiExtractedProcess: "AI process text",
  aiExtractedAction: "AI action text",
  selectedTriggerTool: "Webhook Trigger",
  selectedProcessLogicTool: "Code (Function)",
  selectedActionTool: "Slack (Send Message)",
  selectedLlmModelForGuide: "openai/gpt-3.5-turbo",
};

describe("/api/generate-guide API endpoint", () => {
  beforeEach(() => {
    process.env = { ...originalEnv, OPENROUTER_API_KEY: "test-key" };
    jest
      .spyOn(fs, "readFileSync")
      .mockReturnValue(
        "Guide prompt with {{N8N_WORKFLOW_JSON}} and other {{PLACEHOLDERS}}"
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

  it("should return generated guide markdown on successful LLM call", async () => {
    const mockGuideMarkdown = "### Your Awesome Guide\n- Step 1: ...";
    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: mockGuideMarkdown } }],
        }),
        { status: 200 }
      )
    );
    const response = await POST(mockRequest(validGuideRequestBody));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toEqual({ instructionalGuideMarkdown: mockGuideMarkdown });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const fetchBody = JSON.parse(fetchSpy.mock.calls[0][1]!.body as string);
    expect(fetchBody.model).toBe(
      validGuideRequestBody.selectedLlmModelForGuide
    );
    expect(fetchBody.messages[0].content).toContain(
      validGuideRequestBody.n8nWorkflowJson
    );
  });

  it("should return 400 for invalid request body (e.g., missing n8nWorkflowJson)", async () => {
    const invalidBody = {
      ...validGuideRequestBody,
      n8nWorkflowJson: undefined,
    };
    const response = await POST(mockRequest(invalidBody as any));
    expect(response.status).toBe(400);
    expect(await response.json()).toHaveProperty(
      "error",
      "Invalid request body for guide generation."
    );
  });

  it("should return 500 if LLM returns empty content", async () => {
    fetchSpy = jest
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ choices: [{ message: { content: null } }] }),
          { status: 200 }
        )
      );
    const response = await POST(mockRequest(validGuideRequestBody));
    expect(response.status).toBe(500);
    expect(await response.json()).toHaveProperty(
      "error",
      "LLM response for guide was empty or not in string format."
    );
  });

  // Add more tests: missing API key, LLM API error, prompt file read error etc.
});
