"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Terminal, CheckCircle, AlertCircle, Info } from "lucide-react";
import type { PromptValidationResponse } from "@/lib/validations";

export default function HomePage() {
  const [rawGenerationLoading, setRawGenerationLoading] = useState(false);
  const [rawGenerationError, setRawGenerationError] = useState<string | null>(
    null
  );
  const [llmOutput, setLlmOutput] = useState<string | null>(null);

  const [userPromptInput, setUserPromptInput] = useState<string>("");
  const [validationApiLoading, setValidationApiLoading] = useState(false);
  const [validationApiError, setValidationApiError] = useState<string | null>(
    null
  );
  const [validationData, setValidationData] =
    useState<PromptValidationResponse | null>(null);

  async function handleGenerateAndValidate() {
    setValidationApiLoading(true);
    setValidationApiError(null);
    setValidationData(null);
    setRawGenerationLoading(false);
    setRawGenerationError(null);
    setLlmOutput(null);

    try {
      const response = await fetch("/api/validate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userPrompt: userPromptInput }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            `Validation request failed with status ${response.status}`
        );
      }

      setValidationData(data as PromptValidationResponse);
    } catch (err) {
      if (err instanceof Error) {
        setValidationApiError(err.message);
      } else {
        setValidationApiError(
          "An unexpected error occurred during prompt validation."
        );
      }
      console.error("Validation API error:", err);
    } finally {
      setValidationApiLoading(false);
    }
  }

  async function handleDirectRawGenerate() {
    setRawGenerationLoading(true);
    setRawGenerationError(null);
    setLlmOutput(null);
    setValidationApiError(null);
    setValidationData(null);

    try {
      const response = await fetch("/api/generate-raw", { method: "POST" });
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "An unknown error occurred" }));
        throw new Error(
          errorData.error || `Request failed with status ${response.status}`
        );
      }
      const data = await response.json();
      setLlmOutput(data.output);
    } catch (err) {
      if (err instanceof Error) {
        setRawGenerationError(err.message);
      } else {
        setRawGenerationError(
          "An unexpected error occurred during raw generation."
        );
      }
    } finally {
      setRawGenerationLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 space-y-6">
      <h1 className="text-3xl font-bold">n8n Workflow Generator (Sprint 2)</h1>

      <div className="w-full max-w-2xl space-y-4">
        <label
          htmlFor="userPrompt"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Enter your automation goal:
        </label>
        <Textarea
          id="userPrompt"
          placeholder="e.g., Notify me via Slack when a Google Form is submitted and the response contains 'urgent'."
          value={userPromptInput}
          onChange={(e) => setUserPromptInput(e.target.value)}
          className="min-h-[100px]"
        />
        <Button
          onClick={handleGenerateAndValidate}
          disabled={validationApiLoading || rawGenerationLoading}
          className="w-full sm:w-auto"
        >
          {validationApiLoading
            ? "Validating Prompt..."
            : rawGenerationLoading
            ? "Generating Raw..."
            : "Validate & Generate (S2 Flow)"}
        </Button>
      </div>

      {validationApiLoading && (
        <div className="w-full max-w-2xl p-4 text-center">
          <p>Validating your prompt... Please wait.</p>
        </div>
      )}
      {validationApiError && (
        <Alert variant="destructive" className="w-full max-w-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Error</AlertTitle>
          <AlertDescription>{validationApiError}</AlertDescription>
        </Alert>
      )}
      {validationData && !validationData.valid && (
        <Alert variant="default" className="w-full max-w-2xl">
          <Info className="h-4 w-4" />
          <AlertTitle>Prompt Needs Improvement</AlertTitle>
          <AlertDescription>
            {validationData.feedback}
            {validationData.suggestions &&
              validationData.suggestions.length > 0 && (
                <div className="mt-2">
                  <p className="font-semibold">Suggestions:</p>
                  <ul className="list-disc list-inside pl-2">
                    {validationData.suggestions.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
          </AlertDescription>
        </Alert>
      )}
      {validationData && validationData.valid && (
        <Alert variant="default" className="w-full max-w-2xl">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Prompt Validated!</AlertTitle>
          <AlertDescription>
            <p>Here are the extracted components:</p>
            <ul className="mt-2 space-y-1">
              <li>
                <strong>Trigger:</strong>{" "}
                {validationData.trigger || "Not specified"}
              </li>
              <li>
                <strong>Process:</strong>{" "}
                {validationData.process || "Not specified"}
              </li>
              <li>
                <strong>Action:</strong>{" "}
                {validationData.action || "Not specified"}
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {rawGenerationLoading && (
        <div className="w-full max-w-2xl p-4 text-center">
          <p>Loading Raw LLM Output... Please wait.</p>
        </div>
      )}
      {rawGenerationError && (
        <Alert variant="destructive" className="w-full max-w-2xl">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Raw Generation Error</AlertTitle>
          <AlertDescription>{rawGenerationError}</AlertDescription>
        </Alert>
      )}
      {llmOutput && (
        <div className="w-full max-w-4xl p-4 mt-4 border rounded-md bg-gray-50 dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2">
            Raw LLM Output (from /api/generate-raw):
          </h2>
          <pre className="whitespace-pre-wrap text-sm">{llmOutput}</pre>
        </div>
      )}
    </main>
  );
}
