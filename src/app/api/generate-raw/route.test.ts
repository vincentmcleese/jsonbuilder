/** @jest-environment node */

import { POST } from "./route"; // Adjust path as necessary
import { NextRequest } from "next/server";
import { jest } from "@jest/globals"; // Or import { jest } from '@jest/globals'; depending on setup
import fs from "fs";

// Mock a minimal NextRequest object
const mockRequest = (body?: any) => {
  return {
    json: async () => body,
    // Add other properties if your route uses them, e.g., headers
  } as NextRequest;
};

// Store original environment variables and fs functions
const originalEnv = process.env;
const originalReadFileSyn = fs.readFileSync;

// Hold a reference to the spy so it can be restored
let fetchSpy: any; // Let TypeScript infer or use a general type

describe("/api/generate-raw API endpoint", () => {
  beforeEach(() => {
    // Reset environment variables and mocks before each test
    process.env = { ...originalEnv };
    jest.resetAllMocks();
    // Restore fs.readFileSync to its original implementation then mock it per test if needed
    fs.readFileSync = originalReadFileSyn;
    // If a spy was created in a previous test, ensure it's restored before creating a new one
    if (fetchSpy) {
      fetchSpy.mockRestore();
    }
  });

  afterEach(() => {
    // Clean up spies after each test to avoid interference
    if (fetchSpy) {
      fetchSpy.mockRestore();
    }
  });

  afterAll(() => {
    // Restore original environment after all tests
    process.env = originalEnv;
    fs.readFileSync = originalReadFileSyn;
  });

  it("should return LLM output on successful OpenRouter call", async () => {
    process.env.OPENROUTER_API_KEY = "test-api-key";
    const mockLlmOutput = "Generated n8n JSON and guide here";

    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: mockLlmOutput } }],
        }),
        { status: 200, statusText: "OK" }
      )
    );

    // Mock fs.readFileSync
    jest.spyOn(fs, "readFileSync").mockReturnValue("Mocked prompt content");

    const response = await POST(mockRequest());
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.output).toBe(mockLlmOutput);
    expect(fs.readFileSync).toHaveBeenCalledWith(
      expect.stringContaining("prompts/generation/INSTRUCTIONS.md"),
      "utf-8"
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-api-key",
        }),
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: "Mocked prompt content" },
          ],
        }),
      })
    );
  });

  it("should return 500 if OPENROUTER_API_KEY is not set", async () => {
    delete process.env.OPENROUTER_API_KEY;

    const response = await POST(mockRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("API key not configured. Please contact support.");
  });

  it("should return 500 if prompt file cannot be read", async () => {
    process.env.OPENROUTER_API_KEY = "test-api-key";
    jest.spyOn(fs, "readFileSync").mockImplementation(() => {
      throw new Error("File read error");
    });

    const response = await POST(mockRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe(
      "Could not load prompt instructions. Please contact support."
    );
  });

  it("should return 500 and error details on OpenRouter API error", async () => {
    process.env.OPENROUTER_API_KEY = "test-api-key";
    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: { message: "OpenRouter specific error" } }),
        {
          status: 503,
          statusText: "Service Unavailable",
        }
      )
    );
    jest.spyOn(fs, "readFileSync").mockReturnValue("Mocked prompt content");

    const response = await POST(mockRequest());
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe("Failed to fetch from LLM: Service Unavailable");
    expect(data.details).toEqual({
      error: { message: "OpenRouter specific error" },
    });
  });

  it("should return 500 if OpenRouter response is missing expected structure", async () => {
    process.env.OPENROUTER_API_KEY = "test-api-key";
    fetchSpy = jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ some_unexpected_structure: true }), {
        status: 200,
        statusText: "OK",
      })
    );
    jest.spyOn(fs, "readFileSync").mockReturnValue("Mocked prompt content");

    const response = await POST(mockRequest());
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Unexpected response structure from LLM.");
  });
});
