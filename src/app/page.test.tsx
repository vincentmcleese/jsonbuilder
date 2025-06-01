import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import HomePage from "./page"; // Adjust path to your HomePage component
import { server } from "@/mocks/server"; // MSW server
import { http, HttpResponse } from "msw";
import "@testing-library/jest-dom";
import {
  PromptValidationResponse,
  GenerateRawRequest,
  ClientFacingValidationResponse,
} from "@/lib/validations";
import {
  triggerTools,
  processLogicTools,
  actionTools,
  llmModels,
} from "@/lib/toolOptions";
import userEvent from "@testing-library/user-event";

// Helper function to wrap with client context if needed, not necessary for basic HomePage

describe("HomePage - Sprints 2 & 3 Functionality", () => {
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
    const mockClientFacingValidationResponse: ClientFacingValidationResponse = {
      valid: true,
      extractedTriggerText: "AI extracted: when cron job fires",
      extractedProcessText: "AI extracted: if item is urgent",
      extractedActionText: "AI extracted: alert slack channel general",
      matchedTriggerTool: triggerTools[1],
      matchedProcessTool: processLogicTools[1],
      matchedActionTool: actionTools[2],
      feedback: null,
      suggestions: [],
    };
    server.use(
      http.post("/api/validate-prompt", () => {
        return HttpResponse.json(mockClientFacingValidationResponse, {
          status: 200,
        });
      })
    );

    render(<HomePage />);
    fireEvent.change(
      screen.getByRole("textbox", { name: /Enter automation goal/i }),
      { target: { value: "Valid S2 prompt for refined API response" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Validate Prompt/i }));

    await waitFor(() => {
      expect(screen.getByText("Prompt Validated!")).toBeInTheDocument();
    });
    expect(
      screen.getByText(
        /AI Understood Trigger: AI extracted: when cron job fires/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /AI Understood Process: AI extracted: if item is urgent/i
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /AI Understood Action: AI extracted: alert slack channel general/i
      )
    ).toBeInTheDocument();

    expect(screen.getByText("Confirm Tools & Model")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Generate Workflow with Selections/i })
    ).toBeInTheDocument();
  });

  it("S2: displays feedback and suggestions when prompt validation is not valid", async () => {
    const mockInvalidResponse: PromptValidationResponse = {
      valid: false,
      trigger: null,
      process: null,
      action: null,
      feedback: "Prompt is bad.",
      suggestions: ["Fix it."],
    };
    server.use(
      http.post("/api/validate-prompt", async () => {
        return HttpResponse.json(mockInvalidResponse, { status: 200 });
      })
    );

    render(<HomePage />);
    fireEvent.change(
      screen.getByRole("textbox", { name: /Enter automation goal/i }),
      { target: { value: "Invalid prompt" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Validate Prompt/i }));

    await waitFor(() => {
      expect(screen.getByText("Prompt Needs Improvement")).toBeInTheDocument();
    });
    expect(screen.getByText("Prompt is bad.")).toBeInTheDocument();
    expect(screen.getByText("Fix it.")).toBeInTheDocument();
  });

  it("S2: shows validation API error if the call fails", async () => {
    const errorMessage = "Val API Down";
    server.use(
      http.post("/api/validate-prompt", () => {
        return HttpResponse.json({ error: errorMessage }, { status: 500 });
      })
    );

    render(<HomePage />);
    fireEvent.change(
      screen.getByRole("textbox", { name: /Enter automation goal/i }),
      { target: { value: "Prompt causing error" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Validate Prompt/i }));

    await waitFor(() => {
      expect(screen.getByText("Validation Error")).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  // --- Sprint 3 Tests (Tool/Model Selection & Generation Call) ---
  const setupValidValidationState = async () => {
    const mockValidationResponse: PromptValidationResponse = {
      valid: true,
      trigger: triggerTools[0],
      process: processLogicTools[0],
      action: actionTools[0],
      feedback: null,
      suggestions: [],
    };
    server.use(
      http.post("/api/validate-prompt", async () => {
        return HttpResponse.json(mockValidationResponse, { status: 200 });
      })
    );
    render(<HomePage />);
    fireEvent.change(
      screen.getByRole("textbox", { name: /Enter automation goal/i }),
      { target: { value: "Valid prompt for S3" } }
    );
    fireEvent.click(screen.getByRole("button", { name: /Validate Prompt/i }));
    await waitFor(() => {
      expect(screen.getByText("Confirm Tools & Model")).toBeInTheDocument();
    });
  };

  it("S3: pre-populates tool/model selections after successful validation", async () => {
    await setupValidValidationState();
    // Check pre-population (uses getPreselectedTool which defaults to first if no exact match or no validationData field)
    // For this test, validationData.trigger is triggerTools[0], etc.
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
    ).toHaveTextContent(llmModels[0]); // Defaults to first
  });

  it("S3: allows user to change tool and model selections", async () => {
    await setupValidValidationState();
    const user = userEvent.setup();

    // Change Trigger Tool
    const triggerSelectTrigger = screen.getByRole("combobox", {
      name: /Trigger Tool/i,
    });
    await user.click(triggerSelectTrigger);
    const triggerOption = await screen.findByRole("option", {
      name: triggerTools[1],
    });
    await user.click(triggerOption);
    expect(triggerSelectTrigger).toHaveTextContent(triggerTools[1]);

    // Change LLM Model
    const modelSelectTrigger = screen.getByRole("combobox", {
      name: /LLM Model/i,
    });
    await user.click(modelSelectTrigger);
    const modelOption = await screen.findByRole("option", {
      name: llmModels[1],
    });
    await user.click(modelOption);
    expect(modelSelectTrigger).toHaveTextContent(llmModels[1]);
  });

  it("S3: calls /api/generate-raw with selected data and displays output", async () => {
    await setupValidValidationState();
    const user = userEvent.setup();
    const testUserPrompt = "Valid prompt for S3";
    const expectedLlmOutput = "Workflow JSON and Guide based on selections";

    const actionSelectTrigger = screen.getByRole("combobox", {
      name: /Action Tool/i,
    });
    await user.click(actionSelectTrigger);
    const actionOption = await screen.findByRole("option", {
      name: actionTools[2],
    });
    await user.click(actionOption);
    expect(actionSelectTrigger).toHaveTextContent(actionTools[2]);

    server.use(
      http.post("/api/generate-raw", async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json(
          { output: expectedLlmOutput },
          { status: 200 }
        );
      })
    );

    const initialGenerateButton = screen.getByRole("button", {
      name: /Generate Workflow with Selections/i,
    });
    await user.click(initialGenerateButton);

    let loadingButton;
    await waitFor(() => {
      loadingButton = screen.getByRole("button", {
        name: /Generating Workflow.../i,
      });
      expect(loadingButton).toBeInTheDocument();
      expect(loadingButton).toBeDisabled();
    });

    expect(
      screen.getByText(/^Generating workflow...$/, { selector: "p" })
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText(expectedLlmOutput)).toBeInTheDocument()
    );

    await waitFor(() => {
      const finalButton = screen.getByRole("button", {
        name: /Generate Workflow with Selections/i,
      });
      expect(finalButton).toBeInTheDocument();
      expect(finalButton).not.toBeDisabled();
    });
    expect(
      screen.queryByText(/^Generating workflow...$/, { selector: "p" })
    ).not.toBeInTheDocument();
  });

  it("S3: shows error from /api/generate-raw if generation fails", async () => {
    await setupValidValidationState();
    const generationErrorMessage = "LLM Generation Failed";
    server.use(
      http.post("/api/generate-raw", () => {
        return HttpResponse.json(
          { error: generationErrorMessage },
          { status: 500 }
        );
      })
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Generate Workflow with Selections/i })
    );
    await waitFor(() => {
      expect(screen.getByText("Workflow Generation Error")).toBeInTheDocument();
    });
    expect(screen.getByText(generationErrorMessage)).toBeInTheDocument();
  });
});
