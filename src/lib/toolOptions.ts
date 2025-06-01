export const triggerTools = [
  "Webhook Trigger",
  "Cron Trigger",
  "Manual Trigger",
  "Email Read IMAP", // from Email Trigger (IMAP)
  "Google Forms Trigger", // Assuming common, not explicitly in cheat sheet as simple node but common trigger
];

export const processLogicTools = [
  "Code (Function)",
  "IF Node",
  "Switch Node",
  "Set Node",
  "Merge Node",
  "Item Lists Node",
];

export const actionTools = [
  "HTTP Request",
  "OpenAI Chat Model",
  "Slack (Send Message)",
  "Google Sheets (Append/Update)", // Generalized from cheat sheet
  "Notion (Create/Update Page)", // Generalized
  "Email Send (SMTP)",
];

export const llmModels = [
  "openai/gpt-3.5-turbo", // Default
  "openai/gpt-4",
  "anthropic/claude-3-haiku-20240307",
];

// --- Keyword Mappings for Pre-selection ---
interface ToolKeywordMap {
  [toolName: string]: string[];
}

export const triggerToolKeywords: ToolKeywordMap = {
  "Webhook Trigger": [
    "webhook",
    "http request in",
    "incoming request",
    "post received",
    "get received",
  ],
  "Cron Trigger": [
    "schedule",
    "cron",
    "every day",
    "time-based",
    "interval",
    "daily",
    "weekly",
    "hourly",
    "定期",
  ],
  "Manual Trigger": ["manual", "start manually", "on demand"],
  "Email Read IMAP": [
    "email received",
    "new email",
    "imap",
    "read email",
    "when i get an email",
  ],
  "Google Forms Trigger": [
    "google form",
    "form submitted",
    "form response",
    "new survey response",
  ],
};

export const processLogicToolKeywords: ToolKeywordMap = {
  "Code (Function)": [
    "code",
    "function",
    "script",
    "custom logic",
    "javascript",
    "python",
  ],
  "IF Node": ["if", "condition", "conditional"],
  "Switch Node": ["switch", "case", "route by"],
  "Set Node": ["set field", "edit field", "modify data", "add field"],
  "Merge Node": ["merge", "join data", "combine"],
  "Item Lists Node": [
    "item list",
    "split array",
    "aggregate items",
    "loop over",
  ],
};

export const actionToolKeywords: ToolKeywordMap = {
  "HTTP Request": [
    "http request out",
    "call api",
    "send data",
    "post to",
    "get from",
  ],
  "OpenAI Chat Model": [
    "openai",
    "gpt",
    "chatgpt",
    "ai model",
    "generate text",
  ],
  "Slack (Send Message)": [
    "slack",
    "notify slack",
    "send slack message",
    "post to slack",
    "slack alert",
  ],
  "Google Sheets (Append/Update)": [
    "google sheet",
    "spreadsheet",
    "add row to sheet",
    "update sheet",
  ],
  "Notion (Create/Update Page)": ["notion", "create page", "update notion"],
  "Email Send (SMTP)": [
    "send email",
    "smtp",
    "email out",
    "email notification",
    "email to",
    "mail to",
    "send a message to email",
  ],
};
// --- End Keyword Mappings ---

export const getPreselectedTool = (
  availableTools: string[],
  toolKeywords: ToolKeywordMap, // Pass the relevant keyword map
  extractedText: string | null | undefined
): string => {
  if (extractedText) {
    const searchText = extractedText.toLowerCase();
    // 1. Exact Match Attempt
    const exactMatch = availableTools.find(
      (tool) => tool.toLowerCase() === searchText
    );
    if (exactMatch) return exactMatch;

    // 2. Enhanced Keyword Matching
    for (const toolName of availableTools) {
      const keywords = toolKeywords[toolName] || [];
      for (const keyword of keywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          return toolName;
        }
      }
    }
    // 3. Simple contains match on tool name itself (partial match on tool name, case-insensitive)
    for (const toolName of availableTools) {
      // Match against the base name of the tool, e.g., "Slack" from "Slack (Send Message)"
      const baseToolName = toolName.split(" (")[0].toLowerCase();
      if (searchText.includes(baseToolName)) {
        return toolName;
      }
    }
  }
  return availableTools[0] || ""; // 4. Fallback to the first tool
};
