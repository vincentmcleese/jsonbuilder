import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import HomePage from "./page"; // Adjust path to your HomePage component
import { server } from "@/mocks/server"; // MSW server
import { http, HttpResponse } from "msw";
import "@testing-library/jest-dom";
import {
  PromptValidationResponse,
  GenerateRawRequest,
  ClientFacingValidationResponse,
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

// Helper function to wrap with client context if needed, not necessary for basic HomePage

describe("HomePage - Sprints 2 & 3 Functionality", () => {
  afterEach(cleanup);

  beforeEach(() => {
    server.resetHandlers(); // Reset handlers before each test to ensure isolation
  });
  // beforeAll, afterAll for server.listen/close are in jest.setup.js

  it("renders initial Sprint 3 UI correctly (including S2 elements)", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", {
        name: /n8n Workflow Generator \(Sprint 3 Refined\)/i,
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

  it("S2: calls validation API, shows loading, then displays successful validation data and enables tool selection", async () => {
    const mockS2Response: ClientFacingValidationResponse = {
      valid: true,
      extractedTriggerText: "S2 Success Trigger",
      extractedProcessText: "S2 Success Process",
      extractedActionText: "S2 Success Action",
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
      { target: { value: "S2 success test prompt" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Validate Prompt/i }));

    await waitFor(() => {
      expect(screen.getByText("Prompt Validated!")).toBeInTheDocument();
      expect(
        screen.getByText(
          (content, node) =>
            node?.textContent ===
            `AI Understood Trigger: ${mockS2Response.extractedTriggerText}`
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          (content, node) =>
            node?.textContent ===
            `AI Understood Process: ${mockS2Response.extractedProcessText}`
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          (content, node) =>
            node?.textContent ===
            `AI Understood Action: ${mockS2Response.extractedActionText}`
        )
      ).toBeInTheDocument();

      expect(screen.getByText("Confirm Tools & Model")).toBeInTheDocument();
      expect(
        screen.getByRole("button", {
          name: /Generate Workflow with Selections/i,
        })
      ).toBeInTheDocument();
    });
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
    return defaultMockData;
  };

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
      screen.getByRole("combobox", { name: /LLM Model/i })
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

    await selectShadcnOption(user, /LLM Model/i, llmModels[1]);
    expect(
      screen.getByRole("combobox", { name: /LLM Model/i })
    ).toHaveTextContent(llmModels[1]);
  });

  it("S3/S4: calls /api/generate-raw, displays JSON validity, and separated content", async () => {
    const user = userEvent.setup();
    render(<HomePage />);
    const validationDataUsed = await setupToToolSelectionStageAndGetDefaults(
      user
    );
    const testUserPromptInput = "Test prompt for S3 setup";
    const expectedLlmOutput =
      '{"n8n": "json_workflow"}---JSON-GUIDE-SEPARATOR---### Guide Header\n- Step 1';
    let capturedRawRequestPayload: GenerateRawRequest | null = null;

    server.use(
      http.post("/api/generate-raw", async ({ request }) => {
        capturedRawRequestPayload =
          (await request.json()) as GenerateRawRequest;
        await new Promise((resolve) => setTimeout(resolve, 100));
        return HttpResponse.json(
          {
            output: expectedLlmOutput,
            isJsonSyntaxValid: true,
            generatedJsonString: '{"n8n": "json_workflow"}',
            generatedGuideString: "### Guide Header\n- Step 1",
          },
          { status: 200 }
        );
      })
    );

    await selectShadcnOption(user, /Action Tool/i, actionTools[1]);
    await selectShadcnOption(user, /LLM Model/i, llmModels[1]);

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

    expect(screen.getByText('{"n8n": "json_workflow"}')).toBeInTheDocument();
    expect(screen.getByText(/^### Guide Header/)).toBeInTheDocument();

    expect(capturedRawRequestPayload).not.toBeNull();
    if (capturedRawRequestPayload) {
      expect(capturedRawRequestPayload.userNaturalLanguagePrompt).toBe(
        testUserPromptInput
      );
      expect(capturedRawRequestPayload.selectedTriggerTool).toBe(
        validationDataUsed.matchedTriggerTool
      );
      expect(capturedRawRequestPayload.selectedProcessLogicTool).toBe(
        validationDataUsed.matchedProcessTool
      );
      expect(capturedRawRequestPayload.selectedActionTool).toBe(actionTools[1]);
      expect(capturedRawRequestPayload.selectedLlmModel).toBe(llmModels[1]);
      expect(capturedRawRequestPayload.aiExtractedTrigger).toBe(
        validationDataUsed.extractedTriggerText
      );
      expect(capturedRawRequestPayload.aiExtractedProcess).toBe(
        validationDataUsed.extractedProcessText
      );
      expect(capturedRawRequestPayload.aiExtractedAction).toBe(
        validationDataUsed.extractedActionText
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

  it("S3/S5: shows JSON syntax error from /api/generate-raw", async () => {
    const user = userEvent.setup();
    render(<HomePage />);
    await setupToToolSelectionStageAndGetDefaults(user);
    const mockJsonErrorResponse: GenerateRawApiResponse = {
      rawLlmOutput: "invalid json---JSON-GUIDE-SEPARATOR---Guide here",
      generatedJsonString: "invalid json",
      generatedGuideString: "Guide here",
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
});
