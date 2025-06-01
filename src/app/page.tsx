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
  GenerateRawApiResponse,
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
  const [selectedModel, setSelectedModel] = useState<string>(llmModels[0]);
  const [selectedLlmModelForGuide, setSelectedLlmModelForGuide] =
    useState<string>(llmModels[0]);
  const [showSelections, setShowSelections] = useState(false);

  // Simplified state for S4 generation output
  const [rawGenerationLoading, setRawGenerationLoading] = useState(false);
  const [rawGenerationError, setRawGenerationError] = useState<string | null>(
    null
  );
  const [generationResult, setGenerationResult] =
    useState<GenerateRawApiResponse | null>(null);

  // NEW: Guide Generation States
  const [guideGenerationLoading, setGuideGenerationLoading] = useState(false);
  const [guideGenerationError, setGuideGenerationError] = useState<
    string | null
  >(null);
  const [generatedGuideMarkdown, setGeneratedGuideMarkdown] = useState<
    string | null
  >(null);

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
      setSelectedModel(llmModels[0]);
      setSelectedLlmModelForGuide(llmModels[0]);
      setShowSelections(true);
    } else {
      setShowSelections(false);
    }
  }, [validationData]);

  async function handleValidatePrompt() {
    setValidationApiLoading(true);
    setValidationApiError(null);
    setValidationData(null);
    setShowSelections(false); // Hide selections during new validation
    setRawGenerationError(null); // Clear previous generation errors
    setGenerationResult(null); // Clear previous generation result

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
    setGenerationResult(null);

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
      if (!response.ok) {
        let errorMsg = `Generation request failed: ${response.status} ${response.statusText}`;
        if (data && typeof data === "object") {
          // Check for our API's specific error structure first
          if (
            "jsonSyntaxErrorMessage" in data &&
            typeof (data as GenerateRawApiResponse).jsonSyntaxErrorMessage ===
              "string" &&
            (data as GenerateRawApiResponse).jsonSyntaxErrorMessage
          ) {
            errorMsg = (data as GenerateRawApiResponse)
              .jsonSyntaxErrorMessage as string;
          }
          // Check for a generic { error: "..." } structure
          else if (
            "error" in data &&
            typeof (data as { error?: unknown }).error === "string"
          ) {
            errorMsg = (data as { error: string }).error;
          }
        }
        throw new Error(errorMsg);
      }
      setGenerationResult(data as GenerateRawApiResponse);
    } catch (err) {
      setRawGenerationError(
        err instanceof Error ? err.message : "Generation error"
      );
    } finally {
      setRawGenerationLoading(false);
    }
  }

  async function handleGenerateGuide() {
    if (!generationResult?.generatedJsonString || !validationData) return;
    setGuideGenerationLoading(true);
    setGuideGenerationError(null);
    setGeneratedGuideMarkdown(null);

    const guidePayload = {
      n8nWorkflowJson: generationResult.generatedJsonString,
      userNaturalLanguagePrompt: userPromptInput,
      aiExtractedTrigger: validationData.extractedTriggerText,
      aiExtractedProcess: validationData.extractedProcessText,
      aiExtractedAction: validationData.extractedActionText,
      selectedTriggerTool: selectedTrigger,
      selectedProcessLogicTool: selectedProcess,
      selectedActionTool: selectedAction,
      selectedLlmModelForGuide: selectedLlmModelForGuide,
    };

    try {
      const response = await fetch("/api/generate-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(guidePayload),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Guide generation failed");
      setGeneratedGuideMarkdown(data.instructionalGuideMarkdown);
    } catch (err) {
      setGuideGenerationError(
        err instanceof Error ? err.message : "Guide generation error"
      );
    } finally {
      setGuideGenerationLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 space-y-6">
      <h1 className="text-3xl font-bold">n8n Workflow Generator (Sprint 5)</h1>

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

          {/* LLM Model Select for JSON */}
          <div className="space-y-1">
            <label htmlFor="llmModelJson" className="block text-sm font-medium">
              LLM Model (for JSON) <Bot className="inline h-4 w-4 mb-0.5" />
            </label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger id="llmModelJson">
                <SelectValue placeholder="Select LLM for JSON..." />
              </SelectTrigger>
              <SelectContent>
                {llmModels.map((m) => (
                  <SelectItem key={`json-${m}`} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* NEW: LLM Model Select for Guide */}
          <div className="space-y-1">
            <label
              htmlFor="llmModelGuide"
              className="block text-sm font-medium"
            >
              LLM Model (for Guide) <Bot className="inline h-4 w-4 mb-0.5" />
            </label>
            <Select
              value={selectedLlmModelForGuide}
              onValueChange={setSelectedLlmModelForGuide}
            >
              <SelectTrigger id="llmModelGuide">
                <SelectValue placeholder="Select LLM for Guide..." />
              </SelectTrigger>
              <SelectContent>
                {llmModels.map((m) => (
                  <SelectItem key={`guide-${m}`} value={m}>
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

          {/* NEW: Button to Generate Guide - appears after JSON is successfully generated and valid */}
          {generationResult &&
            generationResult.isJsonSyntaxValid &&
            !guideGenerationLoading && (
              <Button
                onClick={handleGenerateGuide}
                className="w-full mt-2"
                variant="outline"
              >
                Generate Guide
              </Button>
            )}
          {guideGenerationLoading && (
            <p className="mt-2">Generating guide...</p>
          )}
        </div>
      )}

      {rawGenerationLoading && <p className="mt-4">Generating n8n JSON...</p>}
      {rawGenerationError && (
        <Alert variant="destructive" className="w-full max-w-2xl mt-4">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Workflow Generation Error</AlertTitle>
          <AlertDescription>{rawGenerationError}</AlertDescription>
        </Alert>
      )}

      {generationResult && !generationResult.isJsonSyntaxValid && (
        <Alert variant="destructive" className="w-full max-w-2xl mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Generated JSON Invalid</AlertTitle>
          <AlertDescription>
            {generationResult.jsonSyntaxErrorMessage ||
              "The LLM output could not be parsed as valid JSON."}
          </AlertDescription>
        </Alert>
      )}
      {generationResult && generationResult.isJsonSyntaxValid && (
        <Alert
          variant="default"
          className="w-full max-w-2xl mt-4 bg-green-50 border-green-300 dark:bg-green-900/30 dark:border-green-700"
        >
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-700 dark:text-green-300">
            Generated JSON is Valid!
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-500">
            The generated n8n workflow JSON is syntactically correct.
          </AlertDescription>
        </Alert>
      )}

      {generationResult?.generatedJsonString && (
        <div className="w-full max-w-4xl p-4 mt-2 border rounded-md bg-gray-900 text-gray-100 dark:bg-gray-800">
          <h3 className="text-lg font-semibold mb-2 text-gray-50">
            Generated n8n Workflow JSON:
          </h3>
          <pre className="whitespace-pre-wrap text-sm overflow-x-auto">
            {generationResult.generatedJsonString}
          </pre>
        </div>
      )}

      {/* NEW: Display for Guide Generation Result */}
      {guideGenerationError && (
        <Alert variant="destructive" className="w-full max-w-2xl mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Guide Generation Error</AlertTitle>
          <AlertDescription>{guideGenerationError}</AlertDescription>
        </Alert>
      )}
      {generatedGuideMarkdown && (
        <div className="w-full max-w-4xl p-4 mt-4 border rounded-md bg-gray-100 dark:bg-gray-700">
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
            Instructional Guide:
          </h3>
          <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
            {generatedGuideMarkdown}
          </pre>
        </div>
      )}
    </main>
  );
}
