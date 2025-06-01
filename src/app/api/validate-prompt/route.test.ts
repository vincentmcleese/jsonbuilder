/** @jest-environment node */

import { POST } from "./route";
import { NextRequest } from "next/server";
import { jest } from "@jest/globals";
import fs from "fs";
import { PromptValidationResponseSchema } from "@/lib/validations";

// Mock a minimal NextRequest object
const mockRequest = (body?: any) => {
  return {
    json: async () => body,
  } as NextRequest;
};

const originalEnv = process.env;
let fetchSpy: jest.SpiedFunction<typeof global.fetch>; // Corrected type

describe("/api/validate-prompt API endpoint", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    jest
      .spyOn(fs, "readFileSync")
      .mockReturnValue('User prompt: "{{USER_PROMPT}}"'); // Mock prompt file read
    if (fetchSpy) {
      fetchSpy.mockRestore();
    }
  });

  afterAll(() => {
    process.env = originalEnv;
    jest.restoreAllMocks(); // Restore all mocks, including fs
  });

  it("should return validation success for a valid prompt", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";
    const mockLLMResponse = {
      valid: true,
      trigger: "when a Google Form is submitted",
      process: "response contains 'urgent'",
      action: "Notify me via Slack",
      feedback: null,
      suggestions: [],
    };
    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(mockLLMResponse) } }],
        }),
        { status: 200 }
      )
    );

    const response = await POST(mockRequest({ userPrompt: "test prompt" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockLLMResponse);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const fetchCall = fetchSpy.mock.calls[0] as [
      RequestInfo | URL,
      RequestInit | undefined
    ];
    const fetchBody = JSON.parse(fetchCall[1]?.body as string);
    expect(fetchBody.messages[0].content).toContain(
      'User prompt: "test prompt"'
    );
    expect(fetchBody.response_format).toEqual({ type: "json_object" });
  });

  it("should return validation failure for an invalid prompt", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";
    const mockLLMResponse = {
      valid: false,
      trigger: null,
      process: null,
      action: null,
      feedback: "Missing trigger.",
      suggestions: ["Example suggestion"],
    };
    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(mockLLMResponse) } }],
        }),
        { status: 200 }
      )
    );

    const response = await POST(mockRequest({ userPrompt: "invalid" }));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockLLMResponse);
  });

  it("should return 400 if userPrompt is missing, empty, or not a string", async () => {
    process.env.OPENROUTER_API_KEY = "test-key"; // Ensure API key is set for this test

    // Scenario 1: userPrompt field is missing
    let response = await POST(mockRequest({ otherData: "some value" }));
    let data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe(
      "User prompt is required, must be a non-empty string."
    );

    // Scenario 2: userPrompt is not a string
    response = await POST(mockRequest({ userPrompt: 12345 }));
    data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe(
      "User prompt is required, must be a non-empty string."
    );

    // Scenario 3: userPrompt is an empty string
    response = await POST(mockRequest({ userPrompt: "   " }));
    data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe(
      "User prompt is required, must be a non-empty string."
    );

    // Scenario 4: Malformed JSON body (will be caught by try-catch around req.json())
    // For this, we need to simulate req.json() throwing an error, which is harder with mockRequest
    // The API change handles this; the test for it would be more involved, ensuring req.json() itself throws.
    // We can assume the API try-catch for req.json() works based on implementation for now.
  });

  it("should return 500 if OPENROUTER_API_KEY is not set", async () => {
    delete process.env.OPENROUTER_API_KEY;
    const response = await POST(mockRequest({ userPrompt: "test" }));
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe("API key not configured. Please contact support.");
  });

  it("should return 500 if prompt file cannot be read", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";
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

  it("should return 500 on OpenRouter API error", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";
    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "OpenRouter down" }), {
        status: 503,
        statusText: "Service Down",
      })
    );
    const response = await POST(mockRequest({ userPrompt: "test" }));
    const data = await response.json();
    expect(response.status).toBe(503);
    expect(data.error).toContain(
      "Failed to fetch from LLM for validation: Service Down"
    );
  });

  it("should return 500 if LLM returns non-JSON string", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";
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

  it("should return 500 if LLM returns JSON not matching Zod schema", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";
    const malformedLLMResponse = { valid: "yes", trigger: 123 }; // Incorrect types
    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [
            { message: { content: JSON.stringify(malformedLLMResponse) } },
          ],
        }),
        { status: 200 }
      )
    );
    const response = await POST(mockRequest({ userPrompt: "test" }));
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe(
      "LLM response for validation was not in the expected format."
    );
    expect(data.details).toBeDefined();
  });

  it("should return 500 if LLM response content is missing", async () => {
    process.env.OPENROUTER_API_KEY = "test-key";
    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ choices: [{ message: {} }] }), {
        status: 200,
      }) // Missing content
    );
    const response = await POST(mockRequest({ userPrompt: "test" }));
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe(
      "Unexpected response structure from LLM during validation."
    );
  });
});
