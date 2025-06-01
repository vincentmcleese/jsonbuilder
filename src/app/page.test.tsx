import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  within,
} from "@testing-library/react";
import HomePage from "./page"; // Adjust path to your HomePage component
import { server } from "@/mocks/server"; // MSW server
import { http, HttpResponse } from "msw";
import "@testing-library/jest-dom";
import {
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
import userEvent from "@testing-library/user-event";
import { selectShadcnOption } from "../test-utils/interactionHelpers"; // Corrected path
import { GenerateGuideRequest } from "@/lib/validations"; // Added import for GenerateGuideRequest

// Helper function to wrap with client context if needed, not necessary for basic HomePage

describe("HomePage - Sprints 2, 3, 5 & 6 Functionality", () => {
  afterEach(cleanup);

  beforeEach(() => {
    server.resetHandlers(); // Reset handlers before each test to ensure isolation
  });
  // beforeAll, afterAll for server.listen/close are in jest.setup.js

  it("renders initial Sprint UI correctly (now reflects S5)", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", {
        name: /n8n Workflow Generator \(Sprint 5\)/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /Enter automation goal/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Validate Prompt/i })
    ).toBeInTheDocument();
  });

  it("updates user prompt input as user types", () => {
    render(<HomePage />);
    const textarea = screen.getByRole("textbox", {
      name: /Enter automation goal/i,
    });
    fireEvent.change(textarea, { target: { value: "New user prompt" } });
    expect(textarea).toHaveValue("New user prompt");
  });

  it("S2: calls validation API, displays successful validation data and enables tool selection", async () => {
    const mockS2Response: ClientFacingValidationResponse = {
      valid: true,
      extractedTriggerText: "S2 Success: Extracted Trigger",
      extractedProcessText: "S2 Success: Extracted Process",
      extractedActionText: "S2 Success: Extracted Action",
      matchedTriggerTool: triggerTools[1],
      matchedProcessTool: processLogicTools[1],
      matchedActionTool: actionTools[1],
      feedback: null,
      suggestions: [],
    };
    server.use(
      http.post("/api/validate-prompt", () => {
        return HttpResponse.json(mockS2Response, { status: 200 });
      })
    );

    render(<HomePage />);
    fireEvent.change(
      screen.getByRole("textbox", { name: /Enter automation goal/i }),
      { target: { value: "Specific S2 success prompt" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Validate Prompt/i }));

    await waitFor(() => {
      expect(screen.getByText("Prompt Validated!")).toBeInTheDocument();
    });

    const successAlertTitle = screen.getByText("Prompt Validated!");
    const successAlert = successAlertTitle.closest('[role="alert"]');
    expect(successAlert).not.toBeNull();

    if (successAlert) {
      expect(
        within(successAlert as HTMLElement).getByText(
          /AI Understood Trigger: S2 Success: Extracted Trigger/i
        )
      ).toBeInTheDocument();
      expect(
        within(successAlert as HTMLElement).getByText(
          /AI Understood Process: S2 Success: Extracted Process/i
        )
      ).toBeInTheDocument();
      expect(
        within(successAlert as HTMLElement).getByText(
          /AI Understood Action: S2 Success: Extracted Action/i
        )
      ).toBeInTheDocument();
    }

    expect(screen.getByText("Confirm Tools & Model")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /Generate Workflow with Selections/i,
      })
    ).toBeInTheDocument();
  });

  it("S2: displays feedback and suggestions when prompt validation is not valid", async () => {
    const mockInvalidResponse: Partial<ClientFacingValidationResponse> = {
      valid: false,
      feedback: "Prompt is very bad.",
      suggestions: ["Try again."],
      extractedTriggerText: null,
      extractedProcessText: null,
      extractedActionText: null,
      matchedTriggerTool: null,
      matchedProcessTool: null,
      matchedActionTool: null,
    };
    server.use(
      http.post("/api/validate-prompt", () => {
        return HttpResponse.json(mockInvalidResponse, { status: 200 });
      })
    );

    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: /Validate Prompt/i }));

    await waitFor(() => {
      expect(screen.getByText("Prompt Needs Improvement")).toBeInTheDocument();
    });
    expect(screen.getByText("Prompt is very bad.")).toBeInTheDocument();
    expect(screen.getByText("Try again.")).toBeInTheDocument();
  });

  it("S2: shows validation API error if the call fails", async () => {
    const errorMessage = "Val API is Down";
    server.use(
      http.post("/api/validate-prompt", () => {
        return HttpResponse.json({ error: errorMessage }, { status: 500 });
      })
    );

    render(<HomePage />);
    fireEvent.click(screen.getByRole("button", { name: /Validate Prompt/i }));

    await waitFor(() => {
      expect(screen.getByText("Validation Error")).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  // --- Sprint 3 Tests (Tool/Model Selection & Generation Call) ---
  const setupToToolSelectionStageAndGetDefaults = async (
    user: ReturnType<typeof userEvent.setup>
  ) => {
    // Default MSW handler for /api/validate-prompt will be used (from src/mocks/handlers.ts)
    await user.type(
      screen.getByRole("textbox", { name: /Enter automation goal/i }),
      "Test prompt for S3 setup"
    );
    await user.click(screen.getByRole("button", { name: /Validate Prompt/i }));
    await screen.findByText("Confirm Tools & Model");
    // This is what the default handler in src/mocks/handlers.ts returns:
    const defaultMockData: ClientFacingValidationResponse = {
      valid: true,
      extractedTriggerText: "Default extracted trigger",
      extractedProcessText: "Default extracted process",
      extractedActionText: "Default extracted action",
      matchedTriggerTool: triggerTools[0],
      matchedProcessTool: processLogicTools[0],
      matchedActionTool: actionTools[0],
      feedback: null,
      suggestions: [],
    };
    server.use(
      http.post("/api/validate-prompt", () =>
        HttpResponse.json(defaultMockData, { status: 200 })
      )
    );

    await user.type(
      screen.getByRole("textbox", { name: /Enter automation goal/i }),
      "Test prompt for S3 setup"
    );
    await user.click(screen.getByRole("button", { name: /Validate Prompt/i }));
    await screen.findByText("Confirm Tools & Model");
    return defaultMockData;
  };

  it("renders initial Sprint 3 UI correctly (including S2 elements)", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", {
        name: /n8n Workflow Generator \(Sprint 5\)/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /Enter automation goal/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Validate Prompt/i })
    ).toBeInTheDocument();
  });

  it("S3: pre-populates with default matched tools after validation", async () => {
    const user = userEvent.setup();
    render(<HomePage />);
    await setupToToolSelectionStageAndGetDefaults(user);
    expect(
      screen.getByRole("combobox", { name: /Trigger Tool/i })
    ).toHaveTextContent(triggerTools[0]);
    expect(
      screen.getByRole("combobox", { name: /Process Logic Tool/i })
    ).toHaveTextContent(processLogicTools[0]);
    expect(
      screen.getByRole("combobox", { name: /Action Tool/i })
    ).toHaveTextContent(actionTools[0]);
    expect(
      screen.getByRole("combobox", { name: /LLM Model \(for JSON\)/i })
    ).toHaveTextContent(llmModels[0]);
  });

  it("S3: allows user to change tool and model selections", async () => {
    const user = userEvent.setup();
    render(<HomePage />);
    await setupToToolSelectionStageAndGetDefaults(user);
    await selectShadcnOption(user, /Trigger Tool/i, triggerTools[1]);
    expect(
      screen.getByRole("combobox", { name: /Trigger Tool/i })
    ).toHaveTextContent(triggerTools[1]);

    await selectShadcnOption(user, /LLM Model \(for JSON\)/i, llmModels[1]);
    expect(
      screen.getByRole("combobox", { name: /LLM Model \(for JSON\)/i })
    ).toHaveTextContent(llmModels[1]);
  });

  it("S3/S4: calls /api/generate-raw, displays JSON validity, and separated content", async () => {
    const user = userEvent.setup();
    render(<HomePage />);
    const validationDataUsed = await setupToToolSelectionStageAndGetDefaults(
      user
    );
    const testUserPromptInput = "Test prompt for S3 setup";
    const expectedJsonString = '{"n8n": "json_workflow"}';

    let capturedRawRequestPayload: GenerateRawRequest | null = null;
    server.use(
      http.post("/api/generate-raw", async ({ request: _request }) => {
        capturedRawRequestPayload =
          (await _request.json()) as GenerateRawRequest;
        await new Promise((resolve) => setTimeout(resolve, 100));
        const mockApiResponse: GenerateRawApiResponse = {
          generatedJsonString: expectedJsonString,
          isJsonSyntaxValid: true,
          jsonSyntaxErrorMessage: null,
        };
        return HttpResponse.json(mockApiResponse, { status: 200 });
      })
    );

    await selectShadcnOption(user, /Action Tool/i, actionTools[1]);
    await selectShadcnOption(user, /LLM Model \(for JSON\)/i, llmModels[1]);

    const initialGenerateButton = screen.getByRole("button", {
      name: /Generate Workflow with Selections/i,
    });
    await user.click(initialGenerateButton);

    await waitFor(() => {
      expect(initialGenerateButton).toBeDisabled();
    });

    expect(initialGenerateButton).toHaveTextContent(/Generating Workflow.../i);
    expect(
      screen.getByText(/^Generating workflow...$/, { selector: "p" })
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText("Generated JSON is Valid!")).toBeInTheDocument()
    );

    expect(screen.getByText(expectedJsonString)).toBeInTheDocument();

    expect(capturedRawRequestPayload).not.toBeNull();

    const payloadToAssert = capturedRawRequestPayload;
    if (payloadToAssert) {
      expect(payloadToAssert.userNaturalLanguagePrompt).toBe(
        testUserPromptInput
      );
      expect(payloadToAssert.selectedTriggerTool).toBe(
        validationDataUsed.matchedTriggerTool
      );
      expect(payloadToAssert.selectedProcessLogicTool).toBe(
        validationDataUsed.matchedProcessTool
      );
      expect(payloadToAssert.selectedActionTool).toBe(actionTools[1]);
      expect(payloadToAssert.selectedLlmModel).toBe(llmModels[1]);
      expect(payloadToAssert.aiExtractedTrigger).toBe(
        validationDataUsed.extractedTriggerText
      );
      expect(payloadToAssert.aiExtractedProcess).toBe(
        validationDataUsed.extractedProcessText
      );
      expect(payloadToAssert.aiExtractedAction).toBe(
        validationDataUsed.extractedActionText
      );
    } else {
      throw new Error(
        "capturedRawRequestPayload was unexpectedly null after not.toBeNull() check for assertions."
      );
    }

    await waitFor(() => {
      const finalButton = screen.getByRole("button", {
        name: /Generate Workflow with Selections/i,
      });
      expect(finalButton).not.toBeDisabled();
    });
    expect(
      screen.queryByText(/^Generating workflow...$/, { selector: "p" })
    ).not.toBeInTheDocument();
  });

  it("S3: shows general error from /api/generate-raw if API call fails (e.g. 500)", async () => {
    const user = userEvent.setup();
    render(<HomePage />);
    await setupToToolSelectionStageAndGetDefaults(user);
    const generationErrorMessage = "LLM Service Unavailable";
    server.use(
      http.post("/api/generate-raw", () =>
        HttpResponse.json({ error: generationErrorMessage }, { status: 503 })
      )
    );
    await user.click(
      screen.getByRole("button", { name: /Generate Workflow with Selections/i })
    );
    await waitFor(() =>
      expect(screen.getByText("Workflow Generation Error")).toBeInTheDocument()
    );
    expect(screen.getByText(generationErrorMessage)).toBeInTheDocument();
  });

  it("S3/S5: displays JSON syntax error from /api/generate-raw", async () => {
    const user = userEvent.setup();
    render(<HomePage />);
    await setupToToolSelectionStageAndGetDefaults(user);
    const mockJsonErrorResponse: GenerateRawApiResponse = {
      generatedJsonString: "invalid json",
      isJsonSyntaxValid: false,
      jsonSyntaxErrorMessage: "Syntax error at position 0",
    };
    server.use(
      http.post("/api/generate-raw", () =>
        HttpResponse.json(mockJsonErrorResponse, { status: 200 })
      )
    );
    await user.click(
      screen.getByRole("button", { name: /Generate Workflow with Selections/i })
    );
    await waitFor(() =>
      expect(screen.getByText("Generated JSON Invalid")).toBeInTheDocument()
    );
    expect(screen.getByText(/Syntax error at position 0/i)).toBeInTheDocument();
  });

  describe("Sprint 6 Guide Generation", () => {
    const setupForGuideGeneration = async (
      user: ReturnType<typeof userEvent.setup>
    ) => {
      await setupToToolSelectionStageAndGetDefaults(user);

      const mockJsonResponse: GenerateRawApiResponse = {
        generatedJsonString: JSON.stringify({ mock: "workflow for S6 setup" }), // Unique content
        isJsonSyntaxValid: true,
        jsonSyntaxErrorMessage: null,
        // No rawLlmOutput or generatedGuideString here as per GenerateRawApiResponse schema for S5 output
      };
      server.use(
        http.post("/api/generate-raw", async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return HttpResponse.json(mockJsonResponse, { status: 200 }); // Ensure status 200
        })
      );

      await user.click(
        screen.getByRole("button", {
          name: /Generate Workflow with Selections/i,
        })
      );
      await screen.findByText("Generated JSON is Valid!");
      await screen.findByRole("button", { name: /Generate Guide/i });
      return mockJsonResponse;
    };

    it("S6: Generate Guide button appears after successful JSON syntax validation", async () => {
      const user = userEvent.setup();
      render(<HomePage />);
      await setupForGuideGeneration(user);
      expect(
        screen.getByRole("button", { name: /Generate Guide/i })
      ).toBeInTheDocument();
    });

    it("S6: calls /api/generate-guide and displays returned markdown guide", async () => {
      const user = userEvent.setup();
      render(<HomePage />);
      const genResult = await setupForGuideGeneration(user);

      const mockGuideMarkdown = "### This is the Guide Content";
      server.use(
        http.post(
          "/api/generate-guide",
          async ({ request: _requestNotUsed }) => {
            const payload =
              (await _requestNotUsed.json()) as GenerateGuideRequest;
            expect(payload.n8nWorkflowJson).toEqual(
              genResult.generatedJsonString
            );
            expect(payload.selectedLlmModelForGuide).toBeDefined();
            return HttpResponse.json(
              { instructionalGuideMarkdown: mockGuideMarkdown },
              { status: 200 }
            );
          }
        )
      );

      await user.click(screen.getByRole("button", { name: /Generate Guide/i }));
      await waitFor(() =>
        expect(screen.getByText(/Generating guide.../i)).toBeInTheDocument()
      );
      await waitFor(() =>
        expect(screen.getByText(mockGuideMarkdown)).toBeInTheDocument()
      );
      expect(
        screen.queryByText(/Generating guide.../i)
      ).not.toBeInTheDocument();
    });

    it("S6: shows error if guide generation API call fails", async () => {
      const user = userEvent.setup();
      render(<HomePage />);
      await setupForGuideGeneration(user);
      const guideErrorMessage = "Guide LLM Failed";
      server.use(
        http.post("/api/generate-guide", () =>
          HttpResponse.json({ error: guideErrorMessage }, { status: 500 })
        )
      );
      await user.click(screen.getByRole("button", { name: /Generate Guide/i }));
      await waitFor(() =>
        expect(screen.getByText("Guide Generation Error")).toBeInTheDocument()
      );
      expect(screen.getByText(guideErrorMessage)).toBeInTheDocument();
    });
  });
});
