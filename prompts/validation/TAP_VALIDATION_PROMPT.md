Your task is to analyze a user's automation request. Identify the following components based on the TAP (Trigger, Action, Purpose) framework and determine if it's a valid automation use case.

1.  **TRIGGER**: When should this automation run or what event initiates it? (e.g., "when a form is submitted", "every day at 9am", "when I receive an email with 'invoice' in the subject")
2.  **PROCESS**: What data manipulation, filtering, or conditional logic is needed between the trigger and the action? (This is optional, e.g., "filter for emails from specific senders", "format the date", "wait for 10 minutes")
3.  **ACTION**: What is the primary task the automation should perform? (e.g., "send a Slack notification", "create a Google Calendar event", "add a row to a Google Sheet")
4.  **PURPOSE (Implicit)**: Does the request have a clear underlying goal or benefit, even if not explicitly stated? (This helps determine if it's a sensible automation).

Based on your analysis, respond strictly with a JSON object matching the following structure:

```json
{
  "valid": boolean, // True if the request is a valid automation use case with at least a trigger and an action, and an implied purpose. False otherwise.
  "trigger": "string | null", // Extracted trigger phrase, or null if not identifiable.
  "process": "string | null", // Extracted process logic, or null if not identifiable or not present.
  "action": "string | null", // Extracted action phrase, or null if not identifiable.
  "feedback": "string | null", // If not valid, provide specific feedback (e.g., "Missing trigger: Please specify when this automation should run.", "Missing action: Please specify what the automation should do.", "Unclear purpose: Please clarify what you're trying to achieve for this automation."). Null if valid.
  "suggestions": [
    // If not valid, provide 1-2 examples of well-structured automation requests. Empty array if valid.
    // e.g., "Notify me via Slack when a new Google Form response is submitted.", "Every Monday at 8 AM, get tasks from Todoist due this week and send them to my email."
  ]
}
```

User prompt: "{{USER_PROMPT}}"

Ensure your entire response is only the JSON object described above, with no extra text or explanations before or after it.
