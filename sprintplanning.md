**Guiding Principles for Sprints:**

- **Demonstrable Value:** Each sprint should end with something that can be shown and interacted with, even if very basic initially.
- **Small & Manageable:** Aim for features that can realistically be completed by a small team (or individual) in a short timeframe (e.g., 1-2 weeks, adjust as needed).
- **Iterative Build-up:** Features from previous sprints are foundational for subsequent ones.
- **Focus:** Each sprint has a primary goal.

---

**User Requirements Index (MVP Features to be covered by Sprints):**

- Prompt Input
- AI Prompt Validation (TAP Framework: Trigger, Action, Purpose)
- Tool Selection/Confirmation (User can override AI suggestions)
- LLM Prompt Templating (using `INSTRUCTIONS.md` and selected tools)
- JSON + Instructional Guide Generation
- JSON Schema Validation (Syntax + Basic n8n Structure)
- Output Display (Rendered Guide, Formatted JSON)
- Copy/Download Outputs (JSON + Guide)
- Visual Workflow Preview (Simple Node Map)
- Go Back/Restart Workflow Generation
- Save/Version Workflows (Local Storage)
- **NEW:** LLM Model and Version Selection (via OpenRouter)
- System Maintainability and Continuous Improvement (Admin Interface for Prompts)
- Operational Flexibility for Prompt Optimization
- Audit Trail for Prompt Changes

---

## Sprint Plan: LLM-Powered n8n Workflow Generator (MVP)

**Sprint 1: Core LLM Connection & Raw Output**

- **Goal:** Connect to the LLM via OpenRouter and display raw, unvalidated output based on a hardcoded prompt and model.
- **Key Features/Tasks:**
  1.  **API Route for LLM (Backend):**
      - Create a Next.js API route (e.g., `/api/generate-raw`).
      - Implement logic to securely call the **OpenRouter API** with a prompt read from `resources/INSTRUCTIONS.md` and a _hardcoded model and version_ (`openai/gpt-3.5-turbo`).
  2.  **Frontend-Backend Communication:**
      - Wire up the "Generate" button from the main page (/) to call this new API route.
      - Display the raw text response from the LLM in the designated placeholder sections (JSON output area for now).
      - Implement loading and basic error states.
  3.  **Testing Strategy Implementation:**
      - Set up Mock Service Worker (MSW) for API mocking in tests and browser.
      - Write unit tests for the API route (success, errors, API key presence).
      - Write tests for the frontend (initial render, API call, loading, success/error display).
- **Demonstrable Value:** User can click "Generate," the app calls an LLM via OpenRouter (using content from `INSTRUCTIONS.md`), and _some_ text (intended to be JSON and guide later) appears on the screen. Loading and basic error states are functional.
- **User Requirements Addressed (Partially):**
  - Prompt input (UI still there, but not fully used for generation yet beyond being passed to API)
  - LLM prompt templating (basic internal setup, reading from `INSTRUCTIONS.md`)
  - JSON + guide generation (raw, unparsed, unvalidated output shown in JSON area)
  - **NEW (Setup):** LLM Model and Version Selection (OpenRouter integration initiated)
- **Decisions/Notes:**
  - Used direct `fetch` for OpenRouter API calls (no specific Node.js SDK chosen).
  - API prompt is read from `resources/INSTRUCTIONS.md` to avoid issues with complex string literals in code.
  - MSW configured for Jest tests and browser development environment.
- **Status:** Not Completed
- **Changelog Entry**

---

**Sprint 2: User Prompt Integration & AI Validation**

- **Goal:** Use the user's natural language input and validate it using AI before proceeding.
- **Key Features/Tasks:**
  1.  **User Input to API (Frontend/Backend):**
      - Pass the text from the "Natural Language Prompt" input field to the API route.
  2.  **AI Prompt Validation (Backend):**
      - Create a new API route (e.g., `/api/validate-prompt`) that uses AI to analyze the user's prompt.
      - Implement the TAP (Trigger, Action, Purpose) validation framework.
      - Return structured validation results including extracted components and feedback.
  3.  **Validation UI (Frontend):**
      - Show loading state while validating.
      - Display clear error messages if prompt is invalid (missing trigger, action, or unclear purpose).
      - Show suggestions for improving the prompt.
      - If valid, proceed to tool selection with extracted components.
- **Demonstrable Value:** User types a request, the app validates it using AI, and provides immediate feedback on whether it's a valid automation use case. Invalid prompts get helpful suggestions.
- **User Requirements Addressed:**
  - Prompt input (now actively used)
  - AI prompt validation (new requirement fully implemented)

---

**Sprint 3: Tool Selection Preview with AI Pre-population**

- **Goal:** Implement the UI for tool selection with AI-suggested pre-population based on validated prompt, and add UI for model/version selection.
- **Key Features/Tasks:**
  1.  **Enhanced Tool Selection UI (Frontend):**
      - Add UI elements (e.g., dropdowns) for "Trigger," "Process Logic," and "Action(s)".
      - Populate these with a small, fixed list of common n8n tools (e.g., 3-5 options per category based on `n8n_Cheat_Sheet_Guide.md`).
      - **NEW:** Pre-select tools based on AI extraction from Sprint 2 validation.
      - **NEW:** Add UI elements (e.g., dropdowns) for selecting LLM Model and Version (populated from OpenRouter, or a curated list initially).
  2.  **Pass Tool & Model Selections to API (Frontend/Backend):**
      - When "Generate" is clicked, send the selected tools, selected model/version, and the natural language prompt to the API route.
  3.  **API to Receive Tools & Model (Backend):**
      - Modify the API route to accept the selected tool parameters, model/version, and validated prompt components.
- **Demonstrable Value:** User enters a prompt, it gets validated, and the tool selection screen appears with AI-suggested tools pre-selected. User can also select their desired LLM model and version, then modify selections before proceeding.
- **User Requirements Addressed:**
  - Tool selection/confirmation step (UI and data path implemented with AI assistance)
  - **NEW:** LLM Model and Version Selection (UI and data path)

---

**Sprint 4: LLM Prompt Enhancement with Tool & Model Selection & Basic JSON Display**

- **Goal:** Have the LLM (chosen via OpenRouter) use the selected tools in its generation process and display the JSON part more clearly.
- **Key Features/Tasks:**
  1.  **Tool-Aware and Model-Aware LLM Prompt (Backend):**
      - `INSTRUCTIONS.md` (v1.0): Significantly update to instruct the LLM to generate a workflow specifically using the user-selected Trigger, Process, and Action tools.
      - Dynamically insert tool names into the prompt sent to the LLM.
      - Pass the user-selected model and version to OpenRouter.
      - Include the validated prompt components from Sprint 2.
      - _Bonus (if time allows):_ Start injecting very simple structural examples for the _types_ of selected nodes from `n8n_Cheat_Sheet_Guide.md` into the prompt.
  2.  **Separate JSON/Guide Display (Frontend):**
      - Assume the LLM _attempts_ to provide JSON and a guide (even if still in one block of text).
      - Make a basic attempt to split the LLM response if a clear delimiter is used (e.g., "JSON:\n---\nGUIDE:\n---").
      - Display the (assumed) JSON portion in a `<pre>` tag for better formatting.
- **Demonstrable Value:** User's validated prompt, selected tools, and chosen model/version result in LLM output that references and uses those specific tools. The JSON part looks more like JSON.
- **User Requirements Addressed (Partially):**
  - LLM prompt templating (now tool-aware and validation-aware)
  - JSON + guide generation (output quality improving)
  - **NEW:** LLM Model and Version Selection (actively used in generation)

---

**Sprint 5: Basic JSON Validation & User Feedback**

- **Goal:** Implement syntax validation for the generated JSON and inform the user.
- **Key Features/Tasks:**
  1.  **JSON Syntax Validation (Backend):**
      - In the API route, after receiving the LLM response, attempt to `JSON.parse()` the part identified as the n8n workflow.
      - If parsing fails, note it as an error.
  2.  **Validation Feedback (Frontend):**
      - Display a message to the user if JSON validation failed (e.g., "Generated JSON is not valid.") or succeeded.
- **Demonstrable Value:** The app now checks if the LLM produced syntactically valid JSON and tells the user.
- **User Requirements Addressed:**
  - JSON schema validation (syntax check only)

---

**Sprint 6: Instructional Guide Display & Basic Copy/Download**

- **Goal:** Improve the display of the instructional guide and allow users to copy the outputs.
- **Key Features/Tasks:**
  1.  **Instructional Guide Rendering (Frontend):**
      - If the LLM is instructed to produce Markdown for the guide, use a library like `react-markdown` to render it nicely.
  2.  **Copy to Clipboard (Frontend):**
      - Add "Copy JSON" and "Copy Guide" buttons.
  3.  **Download Functionality (Frontend - Basic):**
      - Add "Download JSON" and "Download Guide" buttons that save the respective content as `.json` and `.txt` (or `.md`) files.
- **Demonstrable Value:** The instructional guide is well-formatted. Users can easily copy or download the generated JSON and guide.
- **User Requirements Addressed:**
  - Output Display (guide rendering)
  - Copy/download (JSON + guide)

---

**Sprint 7: Visual Workflow Preview (Simple Node Map)**

- **Goal:** Display a very simple visual representation of the generated workflow.
- **Key Features/Tasks:**
  1.  **Parse Workflow Structure (Frontend):**
      - If JSON is valid, extract basic information: node names (`nodes[].name`, `nodes[].type`) and connections (from `connections` object).
  2.  **Simple Visual Preview (Frontend):**
      - Render a basic list or simple boxes for each node.
      - _Bonus (if time allows):_ Attempt to draw basic lines or arrows for connections if they are simple enough to parse for an MVP.
- **Demonstrable Value:** Alongside the JSON, a basic visual map of the generated workflow nodes appears.
- **User Requirements Addressed:**
  - Visual workflow preview (node map - basic)

---

**Sprint 8: Go Back/Restart & Structural JSON Validation**

- **Goal:** Allow users to restart the process and add more robust JSON validation.
- **Key Features/Tasks:**
  1.  **"Go Back/Restart" Functionality (Frontend):**
      - Add a button or mechanism to clear the current inputs/outputs and allow the user to start over or easily edit their previous prompt/tool selections for regeneration.
  2.  **Structural JSON Validation (Backend):**
      - Beyond syntax, check for key n8n structural elements:
        - Does the root object have a `nodes` array and a `connections` object?
        - Do items in the `nodes` array have `name`, `type`, and `parameters` properties (as seen frequently in `n8n_Cheat_Sheet_Guide.md`)?
      - Update frontend feedback based on these more detailed checks.
- **Demonstrable Value:** Users can iterate more easily. The app now performs more checks on the n8n JSON structure, improving reliability.
- **User Requirements Addressed:**
  - JSON schema validation (structural checks added)
  - Go back/restart (user flexibility)

---

**Sprint 9: Save/Version (Local Storage) & Polish**

- **Goal:** Implement local saving of workflows (including model/version used) and general UI/UX polish.
- **Key Features/Tasks:**
  1.  **Save/Version to Local Storage (Frontend):**
      - Add a "Save Workflow" button that stores the current prompt, selected tools, selected LLM model/version, generated JSON, and guide in the browser's local storage.
      - Add a way to view/load previously saved workflows (simple list for MVP).
  2.  **UI/UX Polish:**
      - Review all user interactions, button states (loading/disabled), error messages, and overall layout for clarity and ease of use.
      - Refine `INSTRUCTIONS.md` based on observed LLM outputs through previous sprints for better consistency.
      - Polish the AI validation experience with smooth transitions and helpful UI states.
- **Demonstrable Value:** Users can save their work locally. The application feels more complete and user-friendly. All MVP user requirements are now satisfied.
- **User Requirements Addressed:**
  - Save/version workflows (local storage, including model/version)
  - All other MVP features refined and polished.

---

**Sprint 10: Prompt Versioning & Admin Interface**

- **Goal:** Implement versioned system prompts and an admin interface for managing them.
- **Key Features/Tasks:**
  1.  **Prompt Versioning System (Backend):**
      - Create a data structure/storage mechanism for versioned prompts (could use JSON files or a simple database table).
      - Each prompt type should have: version number, content, description, created date, and active/inactive status.
      - Support for multiple prompt types: validation prompt, generation prompt template (`INSTRUCTIONS.md`), etc.
  2.  **Admin Route & Authentication (Backend/Frontend):**
      - Create protected `/admin` route (basic auth or environment-based access for MVP).
      - Implement simple authentication check (e.g., admin password from environment variable).
  3.  **Admin UI (Frontend):**
      - List all prompt versions with their metadata.
      - View/edit prompt content in a code editor component (e.g., Monaco editor or simple textarea with syntax highlighting).
      - Create new versions of prompts.
      - Set which version is "active" for production use.
      - Test prompts with sample inputs before activating.
  4.  **Integration with Main App:**
      - Update API routes to use the active version of each prompt type.
      - Add version tracking to generated workflows (which prompt versions were used).
- **Demonstrable Value:** Administrators can manage and improve system prompts without code deployments. A/B testing of prompts becomes possible. All prompt changes are tracked with version history.
- **User Requirements Addressed:**
  - System maintainability and continuous improvement
  - Operational flexibility for prompt optimization
  - Audit trail for prompt changes

---
