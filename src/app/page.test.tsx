import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HomePage from "./page"; // Adjust path to your HomePage component
import { server } from "@/mocks/server"; // MSW server
import { http, HttpResponse } from "msw";
import "@testing-library/jest-dom";

// Helper function to wrap with client context if needed, not necessary for basic HomePage

describe("HomePage", () => {
  beforeAll(() => server.listen()); // Enable MSW server before all tests
  afterEach(() => server.resetHandlers()); // Reset any runtime handlers
  afterAll(() => server.close()); // Clean up MSW server after all tests

  it("renders the initial page correctly", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", {
        name: /n8n Workflow Generator \(MVP - Sprint 1\)/i,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Generate Workflow/i })
    ).toBeInTheDocument();
  });

  it("shows loading state and calls API on generate click, then displays output", async () => {
    const mockOutput = "Successfully generated LLM output.";
    server.use(
      http.post("/api/generate-raw", () => {
        return HttpResponse.json({ output: mockOutput }, { status: 200 });
      })
    );

    render(<HomePage />);
    const generateButton = screen.getByRole("button", {
      name: /Generate Workflow/i,
    });
    fireEvent.click(generateButton);

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    expect(generateButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText(mockOutput)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    expect(generateButton).not.toBeDisabled();
  });

  it("shows error message if API call fails", async () => {
    const errorMessage = "Failed to fetch from LLM";
    server.use(
      http.post("/api/generate-raw", () => {
        return HttpResponse.json({ error: errorMessage }, { status: 500 });
      })
    );

    render(<HomePage />);
    const generateButton = screen.getByRole("button", {
      name: /Generate Workflow/i,
    });
    fireEvent.click(generateButton);

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

    await waitFor(() => {
      // Check for the Alert component's title and description
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText("Error")).toBeInTheDocument(); // AlertTitle
      expect(screen.getByText(errorMessage)).toBeInTheDocument(); // AlertDescription
    });

    expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    expect(generateButton).not.toBeDisabled();
  });

  it("handles generic network error correctly", async () => {
    server.use(
      http.post("/api/generate-raw", () => {
        // Simulate a network error by not returning a valid HttpResponse
        return HttpResponse.error();
      })
    );

    render(<HomePage />);
    const generateButton = screen.getByRole("button", {
      name: /Generate Workflow/i,
    });
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      // The exact error message might vary based on fetch implementation,
      // this checks for a part of the default error message in page.tsx
      expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
    });
  });
});
