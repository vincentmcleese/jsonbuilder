"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react"; // For Alert icon

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [llmOutput, setLlmOutput] = useState<string | null>(null);

  async function handleGenerate() {
    setIsLoading(true);
    setError(null);
    setLlmOutput(null);

    try {
      const response = await fetch("/api/generate-raw", {
        method: "POST",
        // For Sprint 1, no body is sent from client as prompt is hardcoded on backend
        // headers: { 'Content-Type': 'application/json' },
        // body: JSON.stringify({ userInput: 'some input' }),
      });

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
        setError(err.message);
      } else {
        setError("An unexpected error occurred during generation.");
      }
      console.error("Generation error:", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 space-y-6">
      <h1 className="text-3xl font-bold">
        n8n Workflow Generator (MVP - Sprint 1)
      </h1>

      <Button onClick={handleGenerate} disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate Workflow"}
      </Button>

      {error && (
        <Alert variant="destructive" className="w-full max-w-2xl">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="w-full max-w-2xl p-4 text-center">
          <p>Loading... Please wait while the LLM generates the content.</p>
          {/* You could add a spinner here */}
        </div>
      )}

      {llmOutput && (
        <div className="w-full max-w-4xl p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2">Raw LLM Output:</h2>
          <pre className="whitespace-pre-wrap text-sm">{llmOutput}</pre>
        </div>
      )}
    </main>
  );
}
