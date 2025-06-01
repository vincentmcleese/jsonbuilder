import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HomePage from "./page"; // Adjust path to your HomePage component
import { server } from "@/mocks/server"; // MSW server
import { http, HttpResponse } from "msw";
import "@testing-library/jest-dom";
import { PromptValidationResponse } from "@/lib/validations";

// Helper function to wrap with client context if needed, not necessary for basic HomePage

describe("HomePage - Sprint 2", () => {
  beforeEach(() => {
    server.resetHandlers(); // Reset handlers before each test to ensure isolation
  });
  // beforeAll, afterAll for server.listen/close are in jest.setup.js

  it("renders initial Sprint 2 UI correctly", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", {
        name: /n8n Workflow Generator \(Sprint 2\)/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /Enter your automation goal/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Validate & Generate \(S2 Flow\)/i })
    ).toBeInTheDocument();
  });

  it("updates user prompt input as user types", () => {
    render(<HomePage />);
    const textarea = screen.getByRole("textbox", {
      name: /Enter your automation goal/i,
    });
    fireEvent.change(textarea, { target: { value: "New user prompt" } });
    expect(textarea).toHaveValue("New user prompt");
  });

  it("calls validation API, shows loading, then displays successful validation data", async () => {
    const mockValidationResponse: PromptValidationResponse = {
      valid: true,
      trigger: "Test Trigger",
      process: "Test Process",
      action: "Test Action",
      feedback: null,
      suggestions: [],
    };
    server.use(
      http.post("/api/validate-prompt", () => {
        return HttpResponse.json(mockValidationResponse, { status: 200 });
      })
    );

    render(<HomePage />);
    const textarea = screen.getByRole("textbox", {
      name: /Enter your automation goal/i,
    });
    fireEvent.change(textarea, {
      target: { value: "Valid prompt for testing" },
    });

    const validateButton = screen.getByRole("button", {
      name: /Validate & Generate \(S2 Flow\)/i,
    });
    fireEvent.click(validateButton);

    expect(
      screen.getByText(/Validating your prompt... Please wait./i)
    ).toBeInTheDocument();
    expect(validateButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText("Prompt Validated!")).toBeInTheDocument();
    });
    expect(screen.getByText(/Trigger: Test Trigger/i)).toBeInTheDocument();
    expect(screen.getByText(/Process: Test Process/i)).toBeInTheDocument();
    expect(screen.getByText(/Action: Test Action/i)).toBeInTheDocument();
    expect(validateButton).not.toBeDisabled();
  });

  it("displays feedback and suggestions when prompt validation is not valid", async () => {
    const mockInvalidResponse: PromptValidationResponse = {
      valid: false,
      trigger: null,
      process: null,
      action: null,
      feedback: "Your prompt is missing an action.",
      suggestions: [
        "Try adding what the automation should do.",
        "e.g., send an email",
      ],
    };
    server.use(
      http.post("/api/validate-prompt", async () => {
        return HttpResponse.json(mockInvalidResponse, { status: 200 });
      })
    );

    render(<HomePage />);
    fireEvent.change(
      screen.getByRole("textbox", { name: /Enter your automation goal/i }),
      { target: { value: "Invalid prompt" } }
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Validate & Generate \(S2 Flow\)/i })
    );

    await waitFor(() => {
      expect(screen.getByText("Prompt Needs Improvement")).toBeInTheDocument();
    });
    expect(
      screen.getByText("Your prompt is missing an action.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Try adding what the automation should do.")
    ).toBeInTheDocument();
    expect(screen.getByText("e.g., send an email")).toBeInTheDocument();
  });

  it("shows validation API error if the call fails", async () => {
    const errorMessage = "Network error during validation";
    server.use(
      http.post("/api/validate-prompt", () => {
        return HttpResponse.json({ error: errorMessage }, { status: 500 });
      })
    );

    render(<HomePage />);
    fireEvent.change(
      screen.getByRole("textbox", { name: /Enter your automation goal/i }),
      { target: { value: "Prompt causing error" } }
    );
    fireEvent.click(
      screen.getByRole("button", { name: /Validate & Generate \(S2 Flow\)/i })
    );

    await waitFor(() => {
      expect(screen.getByText("Validation Error")).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});
