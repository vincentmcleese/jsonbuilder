"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  PromptVersion,
  PromptType as AdminPromptTypeEnum,
} from "@/types/admin-prompts";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-markdown";
import "prismjs/themes/prism-tomorrow.css";

interface AdminPromptDataEntry {
  displayName: string;
  type: AdminPromptTypeEnum;
  filename: string;
  versions: PromptVersion[];
  availableVariables?: string[];
}

// Separate AdminPanel into its own component to better control mounting
const AdminPanel = () => {
  const [promptData, setPromptData] = useState<Record<string, AdminPromptDataEntry> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedVersionDetails, setSelectedVersionDetails] = useState<{
    version: PromptVersion;
    type: AdminPromptTypeEnum;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState<string>("");
  const [changeDescription, setChangeDescription] = useState<string>("");
  const [editingPromptType, setEditingPromptType] = useState<AdminPromptTypeEnum | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const fetchPrompts = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await fetch("/api/admin/prompts");
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch prompts");
      }
      const data = await response.json();
      setPromptData(data);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Unknown error loading prompts");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const handleViewVersion = (version: PromptVersion, type: AdminPromptTypeEnum) => {
    setSelectedVersionDetails({ version, type });
    setEditableContent(version.content);
    setIsEditing(false);
    setChangeDescription("");
    setEditingPromptType(null);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const handleStartNewVersion = (type: AdminPromptTypeEnum, baseVersion?: PromptVersion) => {
    setEditingPromptType(type);
    setSelectedVersionDetails(baseVersion ? { version: baseVersion, type } : null);
    setEditableContent(baseVersion ? baseVersion.content : "// Start typing your new prompt version here...");
    setChangeDescription("");
    setIsEditing(true);
    setSaveError(null);
    setSaveSuccess(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingPromptType(null);
    setChangeDescription("");
    if (selectedVersionDetails && !editingPromptType) {
      setEditableContent(selectedVersionDetails.version.content);
    } else {
      setEditableContent(selectedVersionDetails?.version.content || "");
    }
  };

  const handleSaveNewVersion = async () => {
    if (!editingPromptType || !changeDescription.trim() || !editableContent.trim()) {
      setSaveError("Change description and prompt content are required and cannot be empty.");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const response = await fetch("/api/admin/add-prompt-version", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promptType: editingPromptType,
          content: editableContent,
          changeDescription: changeDescription,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to save new prompt version.");
      }

      setSaveSuccess(`Successfully saved Version ${result.newVersion.version} for ${editingPromptType.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}! List refreshing.`);
      setIsEditing(false);
      setEditingPromptType(null);
      setChangeDescription("");
      setSelectedVersionDetails(null);
      setEditableContent("");
      fetchPrompts();

      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err) {
      console.error("Save new version error:", err);
      setSaveError(err instanceof Error ? err.message : "An unknown error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const estimateTokens = (text: string | undefined | null): number => {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  };

  if (isLoading) return <div className="p-4 text-center">Loading prompts...</div>;
  if (fetchError) return (
    <Alert variant="destructive" className="m-4">
      <AlertTitle>Error Loading Prompts</AlertTitle>
      <AlertDescription>{fetchError}</AlertDescription>
    </Alert>
  );
  if (!promptData || Object.keys(promptData).length === 0) return (
    <div className="p-4 text-center">
      No prompt data found. Ensure prompt JSON files exist in admin_data/prompts/ and are readable.
    </div>
  );

  const currentEditorContent = isEditing ? editableContent : selectedVersionDetails?.version.content || "";

  let editorTitleStr = "Prompt Content Viewer";
  let currentPromptTypeForEditor: AdminPromptTypeEnum | null = null;
  let activeTrainingDataContent: string | undefined = undefined;
  let estimatedTemplateTokens = 0;
  let estimatedTrainingTokens = 0;
  let estimatedTotalTokens = 0;

  if (isEditing && editingPromptType) {
    editorTitleStr = `Editing New Version for: ${promptData[editingPromptType]?.displayName || editingPromptType}`;
    currentPromptTypeForEditor = editingPromptType;
  } else if (selectedVersionDetails) {
    editorTitleStr = `Viewing V${selectedVersionDetails.version.version} of ${promptData[selectedVersionDetails.type]?.displayName}`;
    currentPromptTypeForEditor = selectedVersionDetails.type;
  }

  if (currentPromptTypeForEditor === AdminPromptTypeEnum.GenerationMain) {
    estimatedTemplateTokens = estimateTokens(currentEditorContent);
    const trainingDataPromptSet = promptData[AdminPromptTypeEnum.GenerationMainTrainingData];
    if (trainingDataPromptSet) {
      const activeTrainingData = trainingDataPromptSet.versions.find((v) => v.isActive) || [...trainingDataPromptSet.versions].sort((a, b) => b.version - a.version)[0];
      if (activeTrainingData) {
        activeTrainingDataContent = activeTrainingData.content;
        estimatedTrainingTokens = estimateTokens(activeTrainingDataContent);
      }
    }
    estimatedTotalTokens = estimatedTemplateTokens + estimatedTrainingTokens;
  } else if (currentPromptTypeForEditor === AdminPromptTypeEnum.GenerationMainTrainingData) {
    estimatedTrainingTokens = estimateTokens(currentEditorContent);
  }

  const availableVarsForCurrentEditor = currentPromptTypeForEditor && promptData && promptData[currentPromptTypeForEditor] ? promptData[currentPromptTypeForEditor].availableVariables : [];

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Prompt Admin Panel</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4 overflow-y-auto max-h-[calc(100vh-150px)] pr-2">
          {Object.values(promptData).map((promptTypeData) => {
            const activeVersion = promptTypeData.versions.find((v) => v.isActive) || promptTypeData.versions.sort((a, b) => b.version - a.version)[0];
            return (
              <div key={promptTypeData.type} className="p-4 border rounded-lg shadow-sm bg-card">
                <h2 className="text-xl font-semibold mb-2 text-card-foreground">
                  {promptTypeData.displayName}
                </h2>
                <p className="text-sm text-muted-foreground mb-2">
                  File: <code className="text-xs bg-muted p-1 rounded">{promptTypeData.filename}</code>
                </p>
                <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                  {promptTypeData.versions
                    .sort((a, b) => b.version - a.version)
                    .map((v) => (
                      <div
                        key={v.version}
                        className={`p-2.5 my-1 rounded-md border-l-4 cursor-pointer hover:shadow-md transition-shadow ${
                          v.isActive ? "border-green-500 bg-green-50 dark:bg-green-900/30" : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30"
                        } ${
                          selectedVersionDetails?.type === promptTypeData.type &&
                          selectedVersionDetails?.version.version === v.version &&
                          !isEditing
                            ? "ring-2 ring-blue-500"
                            : ""
                        }`}
                        onClick={() => handleViewVersion(v, promptTypeData.type)}
                      >
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-sm">
                            Version {v.version} {v.isActive ? (
                              <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                                (Active)
                              </span>
                            ) : ""}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate" title={v.changeDescription}>
                          {v.changeDescription}
                        </p>
                        <p className="text-xs text-muted-foreground/80">
                          Created: {new Date(v.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => handleStartNewVersion(promptTypeData.type, activeVersion)}
                >
                  Create New {promptTypeData.displayName} Version
                </Button>
              </div>
            );
          })}
        </div>

        <div className="md:col-span-2 p-4 border rounded-lg shadow-sm bg-card space-y-3 sticky top-4">
          <h2 className="text-xl font-semibold mb-2 text-card-foreground">{editorTitleStr}</h2>
          {selectedVersionDetails && !isEditing && (
            <div className="text-xs text-muted-foreground p-2 bg-muted rounded mb-2">
              Viewing V{selectedVersionDetails.version.version} ({selectedVersionDetails.version.isActive ? "Active" : "Inactive"}). 
              Desc: {selectedVersionDetails.version.changeDescription}. 
              Last Mod: {new Date(selectedVersionDetails.version.lastModifiedAt).toLocaleString()}
            </div>
          )}

          {(selectedVersionDetails || isEditing) && availableVarsForCurrentEditor && availableVarsForCurrentEditor.length > 0 && (
            <div className="mb-2 p-2 border border-dashed border-blue-300 dark:border-blue-700 rounded-md bg-blue-50 dark:bg-blue-900/20">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Available Variables:</p>
              <div className="w-full flex flex-wrap gap-1">
                {availableVarsForCurrentEditor.map((variable) => (
                  <code key={variable} className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 p-1 rounded inline-block">
                    {variable}
                  </code>
                ))}
              </div>
            </div>
          )}

          {currentPromptTypeForEditor === AdminPromptTypeEnum.GenerationMain && (
            <div className="mb-2 p-2 border border-dashed border-orange-300 dark:border-orange-700 rounded-md bg-orange-50 dark:bg-orange-900/20">
              <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 mb-1">Token Estimates (Approx. 1 token ≈ 4 chars):</p>
              <ul className="text-xs text-orange-700 dark:text-orange-400 space-y-0.5">
                <li>Main Template: ~{estimatedTemplateTokens} tokens</li>
                <li>Active Training Data: ~{estimatedTrainingTokens} tokens (V{promptData[AdminPromptTypeEnum.GenerationMainTrainingData]?.versions.find((v) => v.isActive)?.version || "N/A"})</li>
                <li className="font-semibold">Estimated Total for Prompt: ~{estimatedTotalTokens} tokens</li>
              </ul>
            </div>
          )}

          {currentPromptTypeForEditor === AdminPromptTypeEnum.GenerationMainTrainingData && (
            <div className="mb-2 p-2 border border-dashed border-orange-300 dark:border-orange-700 rounded-md bg-orange-50 dark:bg-orange-900/20">
              <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 mb-1">Token Estimate (Approx. 1 token ≈ 4 chars):</p>
              <p className="text-xs text-orange-700 dark:text-orange-400">This Training Data: ~{estimatedTrainingTokens} tokens</p>
            </div>
          )}

          {isEditing && editingPromptType && (
            <div className="space-y-2 mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <label htmlFor="changeDescription" className="block text-sm font-medium text-card-foreground">
                Change Description for New Version (Required):
              </label>
              <Textarea
                id="changeDescription"
                value={changeDescription}
                onChange={(e) => setChangeDescription(e.target.value)}
                placeholder="describe the changes and purpose of of this new version"
                rows={2}
                required
                className="bg-background"
              />
              {saveError && <p className="text-xs text-red-600 mt-1">{saveError}</p>}
            </div>
          )}

          {!selectedVersionDetails && !isEditing && (
            <div className="text-center text-muted-foreground p-10 border rounded-md h-96 flex items-center justify-center">
              Select a version to view, or click &quot;Create New Version&quot;.
            </div>
          )}

          {(selectedVersionDetails || isEditing) && (
            <div className="relative h-[calc(100vh-450px)] min-h-[300px] border rounded bg-background p-0.5 overflow-auto focus-within:ring-2 focus-within:ring-ring">
              <Editor
                value={currentEditorContent}
                onValueChange={isEditing ? (code) => setEditableContent(code) : () => {}}
                highlight={(code) => highlight(code, languages.markdown, "markdown")}
                padding={10}
                readOnly={!isEditing}
                className="font-mono text-sm !bg-transparent focus-within:!outline-none !outline-none caret-foreground min-h-full"
                textareaClassName="focus:outline-none"
                style={{
                  fontFamily: 'var(--font-geist-mono), SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  fontSize: 13,
                  lineHeight: 1.5,
                  outline: "none",
                  minHeight: "100%",
                }}
              />
            </div>
          )}

          {isEditing ? (
            <div className="flex space-x-2 mt-2">
              <Button
                className="w-full"
                onClick={handleSaveNewVersion}
                disabled={isSaving || !changeDescription.trim() || !editableContent.trim()}
              >
                {isSaving ? "Saving..." : "Save New Version"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCancelEdit}
                disabled={isSaving}
              >
                Cancel Edit
              </Button>
            </div>
          ) : (
            selectedVersionDetails && (
              <Button
                className="w-full mt-2"
                onClick={() => handleStartNewVersion(selectedVersionDetails.type, selectedVersionDetails.version)}
              >
                Create New Version Based on This
              </Button>
            )
          )}

          {saveSuccess && (
            <Alert variant="default" className="mt-2 bg-green-50 border-green-500">
              <AlertTitle className="text-green-700">Success</AlertTitle>
              <AlertDescription className="text-green-600">{saveSuccess}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
};

// Wrap the admin page in a client-side only component
export default function AdminPage() {
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Only check authentication after component mounts on client
  useEffect(() => {
    setIsClient(true);
    if (sessionStorage.getItem("isAdminAuthenticated") === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem("isAdminAuthenticated", "true");
      } else {
        setError(data.error || "Login failed. Please try again.");
        sessionStorage.removeItem("isAdminAuthenticated");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please check the console.");
      console.error("Login error:", err);
    }
    setLoading(false);
  };

  // Don't render anything until we confirm we're on the client
  if (!isClient) {
    return null;
  }

  if (isAuthenticated) {
    return <AdminPanel />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          Admin Login
        </h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              className="mt-1"
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Login Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}