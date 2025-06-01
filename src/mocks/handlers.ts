import { http, HttpResponse } from "msw";
import type { ClientFacingValidationResponse } from "@/lib/validations";
import {
  triggerTools,
  processLogicTools,
  actionTools,
} from "@/lib/toolOptions";

// Default successful response for /api/validate-prompt
const defaultValidationSuccess: ClientFacingValidationResponse = {
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

// Default successful response for /api/generate-raw
const defaultGenerationSuccess = {
  output: "Default_JSON_Content---JSON-GUIDE-SEPARATOR---Default_Guide_Content",
};

// Define your handlers here. For example:
export const handlers = [
  // http.get('/api/user', () => {
  //   return HttpResponse.json({ id: 'c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b3d', firstName: 'John', lastName: 'Maverick' })
  // }),

  // Handler for /api/validate-prompt
  http.post("/api/validate-prompt", async ({ request: _request }) => {
    // This default handler doesn't inspect the request body, just returns success.
    // Tests needing specific request body checks will override this.
    return HttpResponse.json(defaultValidationSuccess, { status: 200 });
  }),

  // Handler for /api/generate-raw
  http.post("/api/generate-raw", async ({ request: _request }) => {
    // This default handler also doesn't inspect the body deeply for default success.
    // It uses the first LLM model if not overridden.
    // const body = await request.json() as GenerateRawRequest;
    // console.log("Default /api/generate-raw handler called with model:", body.selectedLlmModel);
    return HttpResponse.json(defaultGenerationSuccess, { status: 200 });
  }),
];
