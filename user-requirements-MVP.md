# ✅ User Requirements – MVP: LLM-Powered n8n Workflow Generator

## 🎯 Goal

Build a web-based app that enables users to generate valid **n8n JSON workflows** and a clear **instructional guide** using natural language prompts and a custom LLM prompt template. The app is inspired by the **n8n Cheat Sheet** and instructional format found in the **Ghostwriter Guide**.

---

## 🔄 User Flow

1. **Prompt Input**  
   User enters a natural language request or workflow goal (e.g., "Notify me via Slack when a Google Form is submitted").

2. **AI Prompt Validation (New Step)**  
   The app uses AI to validate that the prompt describes a valid automation use case:

   **Validation Framework (TAP - Trigger, Action, Purpose):**

   - **T**rigger: Does the prompt identify WHEN something should happen? (e.g., "when a form is submitted", "every day at 9am", "when I receive an email")
   - **A**ction: Does the prompt specify WHAT should be done? (e.g., "send a notification", "create a document", "update a spreadsheet")
   - **P**urpose: Is there a clear business/personal PURPOSE or outcome? (implicit or explicit)

   **Validation Response:**

   - **Valid:** If all components are present, the AI extracts and structures them, then proceeds to Step 3
   - **Invalid:** If missing components, the app provides specific feedback:
     - "Missing trigger: Please specify when this automation should run"
     - "Missing action: Please specify what the automation should do"
     - "Unclear purpose: Please clarify what you're trying to achieve"
   - **Suggestions:** For invalid prompts, provide examples of well-structured automation requests

3. **Tool Selection Preview (Critical Step)**  
   Based on the validated prompt, the app pre-populates suggested tools but allows user to **validate or choose the key tools (nodes)** involved:

   - **Trigger** (e.g., Google Forms, Webhook) - Pre-filled based on AI extraction
   - **Process Logic** (e.g., filter, wait, format date) - Pre-filled if identified
   - **Action(s)** (e.g., send Slack message, write to Airtable) - Pre-filled based on AI extraction

   This ensures:

   - The LLM prompt is tailored to the exact tools the user expects
   - No unwanted or wrong integrations are included
   - Clear expectations are set before JSON generation

4. **Prompt Construction**  
   App combines user input and selected tools with a predefined **instruction prompt template** (`INSTRUCTIONS.md`) to form the full LLM input.

5. **LLM Generation**  
   LLM returns:

   - A valid n8n JSON workflow
   - A human-readable, step-by-step guide that explains the flow

6. **Validation**  
   App parses the JSON and validates:

   - JSON format correctness
   - Compliance with n8n schema (nodes, connections, structure)

7. **Output Display**  
   App displays:

   - A **visual preview** of the workflow (node map style)
   - The **instructional guide** (step-by-step in markdown or plain text)

8. **User Actions**  
   User can:
   - Copy/download the JSON and guide
   - Save/version the workflow
   - Go back to edit their tools or prompt and regenerate

---

## 🔍 AI Prompt Validation Details

The validation step uses a lightweight LLM call to analyze the user's prompt and extract automation components:

**Request to AI:**

```
Analyze this automation request and identify:
1. TRIGGER: When should this happen?
2. PROCESS: What data processing is needed? (optional)
3. ACTION: What should be done?
4. Is this a valid automation use case?

User prompt: "[user's input]"

Respond with JSON:
{
  "valid": boolean,
  "trigger": "extracted trigger or null",
  "process": "extracted process logic or null",
  "action": "extracted action or null",
  "feedback": "specific feedback if invalid",
  "suggestions": ["example of valid prompt if needed"]
}
```

This ensures users provide well-structured automation requests before proceeding to the more expensive workflow generation step.

---

## 🔧 JSON Validation Approach

The app will validate generated workflows before display by:

1. **Syntax validation**  
   Check if output is well-formed JSON.

2. **Structural validation**  
   Ensure:

   - Each node has `parameters`, `type`, `name`, `position`, etc.
   - Required node properties are present
   - Proper node connections are defined in `connections`

3. **Schema reference**  
   Optionally use n8n's open-source types or a simplified JSON schema to validate structure.

If validation fails, the app will:

- Show an error
- Offer user the chance to re-prompt or retry

---

## 🧠 LLM Prompt Format

Prompt construction includes:

- User-written goal
- Selected tools (trigger, logic, action nodes)
- Instruction template

This ensures high-precision results from the LLM.

---

## 📚 Output Format

- **JSON**: Valid for n8n import.
- **Guide**: Follows AI Ghostwriter instructional format.

---

## 🛠️ Operational Requirements

### Prompt Management & Versioning

The app requires an administrative interface for managing system prompts to enable continuous improvement without code deployments:

1. **Versioned Prompts**

   - All system prompts (validation, generation, etc.) must be versioned
   - Each version includes: version number, content, description, created date, active status
   - Only one version of each prompt type can be active at a time

2. **Admin Interface**

   - Protected admin route with authentication
   - View all prompt versions and their metadata
   - Create new versions of prompts
   - Edit prompt content with syntax highlighting
   - Test prompts before activation
   - Set active version for production use

3. **Audit & Tracking**
   - Track which prompt versions were used for each workflow generation
   - Maintain history of all prompt changes
   - Enable A/B testing of different prompt versions

This operational capability ensures the system can be improved and optimized based on real-world usage without requiring code changes.

---

## 💡 Inspirations

- n8n Cheat Sheet (for structure)
- AI Ghostwriter Guide (for clarity)
- Human-in-the-loop confirmation pattern (for tool selection)
- TAP Framework for automation validation (Trigger, Action, Purpose)
