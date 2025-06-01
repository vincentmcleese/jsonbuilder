/** @jest-environment node */

import { POST } from "./route";
import { NextRequest } from "next/server";
import { jest } from "@jest/globals";
import fs from "fs";
import {
  PromptValidationResponseSchema,
  ClientFacingValidationResponse,
} from "@/lib/validations";
import {
  triggerTools,
  processLogicTools,
  actionTools,
} from "@/lib/toolOptions";
import { z } from "zod";

// Mock a minimal NextRequest object
const mockRequest = (body?: unknown) => {
  return {
    json: async () => body,
  } as NextRequest;
};

const originalEnv = process.env;
let fetchSpy: jest.SpiedFunction<typeof global.fetch>; // Corrected type

describe("/api/validate-prompt API endpoint (Sprint 3 Refined)", () => {
  beforeEach(() => {
    process.env = { ...originalEnv }; // Reset env first
    process.env.OPENROUTER_API_KEY = "test-key"; // Set key for most tests
    // Mock fs.readFileSync consistently for all tests in this describe block
    jest
      .spyOn(fs, "readFileSync")
      .mockReturnValue('User prompt: "{{USER_PROMPT}}" // Template content');
    if (fetchSpy) {
      fetchSpy.mockRestore();
    }
  });

  afterAll(() => {
    process.env = originalEnv;
    jest.restoreAllMocks(); // Restore all mocks, including fs
  });

  it("should return ClientFacingValidationResponse with matched tools on success", async () => {
    const llmProducesThis: z.infer<typeof PromptValidationResponseSchema> = {
      valid: true,
      trigger: "when google form submitted by user for survey",
      process: "filter for priority items only",
      action: "send urgent notification to slack general channel",
      feedback: null,
      suggestions: [],
    };
    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(llmProducesThis) } }],
        }),
        { status: 200 }
      )
    );

    const response = await POST(
      mockRequest({ userPrompt: "Valid user prompt" })
    );
    const data = (await response.json()) as ClientFacingValidationResponse;

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.extractedTriggerText).toBe(llmProducesThis.trigger);
    expect(data.extractedProcessText).toBe(llmProducesThis.process);
    expect(data.extractedActionText).toBe(llmProducesThis.action);
    expect(data.matchedTriggerTool).toBe("Google Forms Trigger"); // Keywords: "google form"
    expect(data.matchedActionTool).toBe("Slack (Send Message)"); // Keywords: "slack"
    // Assuming "filter for priority items only" might map to "IF Node" or fallback to first process tool
    expect(data.matchedProcessTool).toBe(processLogicTools[0]); // Or a more specific match if keywords allow
  });

  it("should handle no specific tool match by falling back to the first tool in the list", async () => {
    const llmProducesThis: z.infer<typeof PromptValidationResponseSchema> = {
      valid: true,
      trigger: "obscure event xr-7",
      process: null,
      action: "log generic info",
      feedback: null,
      suggestions: [],
    };
    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(llmProducesThis) } }],
        }),
        { status: 200 }
      )
    );

    const response = await POST(
      mockRequest({ userPrompt: "A very generic user prompt" })
    );
    const data = (await response.json()) as ClientFacingValidationResponse;

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.extractedTriggerText).toBe(llmProducesThis.trigger);
    expect(data.matchedTriggerTool).toBe(triggerTools[0]); // Fallback
    expect(data.matchedProcessTool).toBe(processLogicTools[0]); // Fallback (process was null, so getPreselectedTool gets null)
    expect(data.matchedActionTool).toBe(actionTools[0]); // Fallback
  });

  it("should return 400 if userPrompt is missing, empty, or not a string", async () => {
    let res = await POST(mockRequest({ otherData: "value" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "User prompt is required, must be a non-empty string.",
    });

    res = await POST(mockRequest({ userPrompt: 123 }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "User prompt is required, must be a non-empty string.",
    });

    res = await POST(mockRequest({ userPrompt: "   " }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: "User prompt is required, must be a non-empty string.",
    });
  });

  it("should return 400 for malformed JSON body", async () => {
    const malformedRequest = new NextRequest(
      "http://localhost/api/validate-prompt",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "this is not json",
      }
    );
    const response = await POST(malformedRequest);
    expect(response.status).toBe(400);
    expect(await response.json()).toHaveProperty(
      "error",
      "Invalid request: Malformed JSON body."
    );
  });

  it("should return 500 if OPENROUTER_API_KEY is not set", async () => {
    delete process.env.OPENROUTER_API_KEY; // Specifically delete for this test
    const response = await POST(mockRequest({ userPrompt: "test" }));
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe("API key not configured. Please contact support.");
  });

  it("should return 500 if prompt file cannot be read", async () => {
    jest.spyOn(fs, "readFileSync").mockImplementation(() => {
      throw new Error("File read error");
    });
    const response = await POST(mockRequest({ userPrompt: "test" }));
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe(
      "Could not load validation instructions. Please contact support."
    );
  });

  it("should return 500 on OpenRouter API error during validation", async () => {
    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "OpenRouter down" }), {
        status: 503,
        statusText: "Service Unavailable",
      })
    );
    const response = await POST(mockRequest({ userPrompt: "test" }));
    expect(response.status).toBe(503);
    expect(await response.json()).toHaveProperty(
      "error",
      "Failed to fetch from LLM for validation: Service Unavailable"
    );
  });

  it("should return 500 if LLM returns non-JSON string for validation", async () => {
    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "This is not JSON." } }],
        }),
        { status: 200 }
      )
    );
    const response = await POST(mockRequest({ userPrompt: "test" }));
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe("LLM response for validation was not valid JSON.");
  });

  it("should return 500 if LLM returns JSON not matching PromptValidationResponseSchema", async () => {
    const malformedLlmData = { valid: "yes", triggerText: 123 }; // Malformed
    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(malformedLlmData) } }],
        }),
        { status: 200 }
      )
    );
    const response = await POST(mockRequest({ userPrompt: "test" }));
    expect(response.status).toBe(500);
    const responseData = await response.json();
    expect(responseData.error).toBe(
      "LLM response for validation was not in the expected format."
    );
    expect(responseData.details).toBeDefined();
  });

  it("should return 500 if LLM response content is missing during validation", async () => {
    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ choices: [{ message: {} }] }), {
        status: 200,
      })
    );
    const response = await POST(mockRequest({ userPrompt: "test" }));
    expect(response.status).toBe(500);
    expect(await response.json()).toHaveProperty(
      "error",
      "Unexpected response structure from LLM during validation."
    );
  });
});
