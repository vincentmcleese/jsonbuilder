"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Terminal,
  CheckCircle,
  AlertCircle,
  Info,
  Zap,
  Cog,
  Bot,
} from "lucide-react";
import type {
  ClientFacingValidationResponse,
  GenerateRawRequest,
} from "@/lib/validations";
import {
  triggerTools,
  processLogicTools,
  actionTools,
  llmModels,
} from "@/lib/toolOptions";

export default function HomePage() {
  const [userPromptInput, setUserPromptInput] = useState<string>("");

  // Validation States (S2)
  const [validationApiLoading, setValidationApiLoading] = useState(false);
  const [validationApiError, setValidationApiError] = useState<string | null>(
    null
  );
  const [validationData, setValidationData] =
    useState<ClientFacingValidationResponse | null>(null);

  // Tool & Model Selection States (S3)
  const [selectedTrigger, setSelectedTrigger] = useState<string>("");
  const [selectedProcess, setSelectedProcess] = useState<string>("");
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>(llmModels[0]); // Default to first model
  const [showSelections, setShowSelections] = useState(false);

  // Raw Generation States (S1, now S3 target)
  const [rawGenerationLoading, setRawGenerationLoading] = useState(false);
  const [rawGenerationError, setRawGenerationError] = useState<string | null>(
    null
  );
  const [llmOutput, setLlmOutput] = useState<string | null>(null);
  const [generatedJson, setGeneratedJson] = useState<string | null>(null);
  const [generatedGuide, setGeneratedGuide] = useState<string | null>(null);

  // Effect to pre-populate selections when validationData is successful
  useEffect(() => {
    if (validationData && validationData.valid) {
      setSelectedTrigger(
        validationData.matchedTriggerTool || triggerTools[0] || ""
      );
      setSelectedProcess(
        validationData.matchedProcessTool || processLogicTools[0] || ""
      );
      setSelectedAction(
        validationData.matchedActionTool || actionTools[0] || ""
      );
      setSelectedModel(llmModels[0]); // Reset to default model on new valid prompt
      setShowSelections(true);
    } else {
      setShowSelections(false);
    }
  }, [validationData]);

  // New useEffect to split llmOutput into JSON and Guide
  useEffect(() => {
    if (llmOutput) {
      const separator = "---JSON-GUIDE-SEPARATOR---";
      const parts = llmOutput.split(separator);
      if (parts.length === 2) {
        setGeneratedJson(parts[0].trim());
        setGeneratedGuide(parts[1].trim());
      } else {
        // Fallback if separator is not found or structure is unexpected
        setGeneratedJson(llmOutput); // Put everything in JSON as a fallback
        setGeneratedGuide(
          "Could not automatically separate JSON and Guide. The full output is shown in the JSON section."
        );
      }
    } else {
      setGeneratedJson(null);
      setGeneratedGuide(null);
    }
  }, [llmOutput]);

  async function handleValidatePrompt() {
    setValidationApiLoading(true);
    setValidationApiError(null);
    setValidationData(null);
    setShowSelections(false); // Hide selections during new validation
    setRawGenerationError(null); // Clear previous generation errors
    setLlmOutput(null); // Clear previous output

    try {
      const response = await fetch("/api/validate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userPrompt: userPromptInput }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || `Validation request failed`);
      setValidationData(data as ClientFacingValidationResponse);
    } catch (err) {
      setValidationApiError(
        err instanceof Error ? err.message : "Validation error"
      );
    } finally {
      setValidationApiLoading(false);
    }
  }

  async function handleGenerateWorkflow() {
    if (!validationData || !validationData.valid || !userPromptInput) {
      setRawGenerationError(
        "Cannot generate workflow without a valid prompt and tool selections."
      );
      return;
    }
    setRawGenerationLoading(true);
    setRawGenerationError(null);
    setLlmOutput(null);
    setGeneratedJson(null);
    setGeneratedGuide(null);

    const payload: GenerateRawRequest = {
      userNaturalLanguagePrompt: userPromptInput,
      selectedTriggerTool: selectedTrigger,
      selectedProcessLogicTool: selectedProcess,
      selectedActionTool: selectedAction,
      selectedLlmModel: selectedModel,
      aiExtractedTrigger: validationData.extractedTriggerText,
      aiExtractedProcess: validationData.extractedProcessText,
      aiExtractedAction: validationData.extractedActionText,
    };

    try {
      const response = await fetch("/api/generate-raw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || `Generation request failed`);
      setLlmOutput(data.output);
    } catch (err) {
      setRawGenerationError(
        err instanceof Error ? err.message : "Generation error"
      );
    } finally {
      setRawGenerationLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 space-y-6">
      <h1 className="text-3xl font-bold">
        n8n Workflow Generator (Sprint 3 Refined)
      </h1>

      <div className="w-full max-w-2xl space-y-4">
        <label htmlFor="userPrompt" className="block text-sm font-medium">
          Enter automation goal:
        </label>
        <Textarea
          id="userPrompt"
          placeholder="e.g., Notify me via Slack..."
          value={userPromptInput}
          onChange={(e) => setUserPromptInput(e.target.value)}
          className="min-h-[100px]"
        />
        <Button
          onClick={handleValidatePrompt}
          disabled={validationApiLoading || rawGenerationLoading}
          className="w-full sm:w-auto"
        >
          {validationApiLoading ? "Validating..." : "Validate Prompt"}
        </Button>
      </div>

      {validationApiLoading && <p>Validating...</p>}
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

      {showSelections && validationData && validationData.valid && (
        <div className="w-full max-w-2xl space-y-6 p-6 border rounded-lg mt-4">
          <h2 className="text-xl font-semibold mb-4 text-center">
            Confirm Tools & Model
          </h2>
          <Alert
            variant="default"
            className="bg-green-50 border-green-300 dark:bg-green-900/30 dark:border-green-700"
          >
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-700 dark:text-green-300">
              Prompt Validated!
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-500 space-y-1">
              <p>
                <strong>AI Understood Trigger:</strong>{" "}
                {validationData.extractedTriggerText || "N/A"}
              </p>
              <p>
                <strong>AI Understood Process:</strong>{" "}
                {validationData.extractedProcessText || "N/A"}
              </p>
              <p>
                <strong>AI Understood Action:</strong>{" "}
                {validationData.extractedActionText || "N/A"}
              </p>
            </AlertDescription>
          </Alert>

          {/* Trigger Select */}
          <div className="space-y-1">
            <label htmlFor="triggerTool" className="block text-sm font-medium">
              Trigger Tool <Zap className="inline h-4 w-4 mb-0.5" />
            </label>
            <Select value={selectedTrigger} onValueChange={setSelectedTrigger}>
              <SelectTrigger id="triggerTool">
                <SelectValue placeholder="Select trigger..." />
              </SelectTrigger>
              <SelectContent>
                {triggerTools.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Process Logic Select */}
          <div className="space-y-1">
            <label htmlFor="processTool" className="block text-sm font-medium">
              Process Logic Tool <Cog className="inline h-4 w-4 mb-0.5" />
            </label>
            <Select value={selectedProcess} onValueChange={setSelectedProcess}>
              <SelectTrigger id="processTool">
                <SelectValue placeholder="Select process logic..." />
              </SelectTrigger>
              <SelectContent>
                {processLogicTools.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Select */}
          <div className="space-y-1">
            <label htmlFor="actionTool" className="block text-sm font-medium">
              Action Tool{" "}
              <Zap className="inline h-4 w-4 mb-0.5 transform rotate-180" />
            </label>
            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger id="actionTool">
                <SelectValue placeholder="Select action..." />
              </SelectTrigger>
              <SelectContent>
                {actionTools.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* LLM Model Select */}
          <div className="space-y-1">
            <label htmlFor="llmModel" className="block text-sm font-medium">
              LLM Model <Bot className="inline h-4 w-4 mb-0.5" />
            </label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger id="llmModel">
                <SelectValue placeholder="Select LLM model..." />
              </SelectTrigger>
              <SelectContent>
                {llmModels.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerateWorkflow}
            disabled={rawGenerationLoading}
            className="w-full mt-4"
          >
            {rawGenerationLoading
              ? "Generating Workflow..."
              : "Generate Workflow with Selections"}
          </Button>
        </div>
      )}

      {rawGenerationLoading && !llmOutput && (
        <p className="mt-4">Generating workflow with selected tools...</p>
      )}
      {rawGenerationError && (
        <Alert variant="destructive" className="w-full max-w-2xl mt-4">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Workflow Generation Error</AlertTitle>
          <AlertDescription>{rawGenerationError}</AlertDescription>
        </Alert>
      )}

      {/* Separated JSON and Guide Display */}
      {generatedJson && (
        <div className="w-full max-w-4xl p-4 mt-6 border rounded-md bg-gray-900 text-gray-100 dark:bg-gray-800">
          <h3 className="text-lg font-semibold mb-2 text-gray-50">
            Generated n8n Workflow JSON:
          </h3>
          <pre className="whitespace-pre-wrap text-sm overflow-x-auto">
            {generatedJson}
          </pre>
        </div>
      )}
      {generatedGuide && (
        <div className="w-full max-w-4xl p-4 mt-4 border rounded-md bg-gray-100 dark:bg-gray-700">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Instructional Guide:
          </h3>
          {/* For S4, simple text display. Markdown rendering can be S6. */}
          <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
            {generatedGuide}
          </pre>
        </div>
      )}

      {/* Fallback for llmOutput if not separated (can be removed if confident in separation) */}
      {/* {!generatedJson && !generatedGuide && llmOutput && (
        <div className="w-full max-w-4xl p-4 mt-6 border rounded-md bg-gray-50 dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-2">Raw LLM Output (could not separate):</h2>
          <pre className="whitespace-pre-wrap text-sm">{llmOutput}</pre>
        </div>
      )} */}
    </main>
  );
}
