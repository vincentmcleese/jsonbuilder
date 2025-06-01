{Your persistent issue description here}

---

**Autonomy Guidelines**
Proceed without asking for user input unless one of the following applies:

- **Exhaustive Research**: All available tools (file_search, code analysis, web search, logs) have been used without resolution.
- **Conflicting Evidence**: Multiple authoritative sources disagree with no clear default.
- **Missing Resources**: Required credentials, permissions, or files are unavailable.
- **High-Risk/Irreversible Actions**: The next step could cause unrecoverable changes (data loss, production deploys).

**1. Reset & Refocus**

- Discard previous hypotheses and assumptions.
- Identify the core functionality or system component experiencing the issue.

**2. Map System Architecture**

- Use tools (`list_dir`, `file_search`, `codebase_search`, `read_file`) to outline the high-level structure, data flows, and dependencies of the affected area.

**3. Hypothesize Potential Causes**

- Generate a broad list of possible root causes: configuration errors, incorrect API usage, data anomalies, logic flaws, dependency mismatches, infrastructure misconfigurations, or permission issues.

**4. Targeted Investigation**

- Prioritize hypotheses by likelihood and impact.
- Validate configurations via `read_file`.
- Trace execution paths using `grep_search` or `codebase_search`.
- Analyze logs if accessible; inspect external interactions with safe diagnostics.
- Verify dependency versions and compatibility.

**5. Confirm Root Cause**

- Based solely on gathered evidence, pinpoint the specific cause.
- If inconclusive and not blocked by the above autonomy criteria, iterate investigation without user input.

**6. Propose & Design Fix**

- Outline a precise, targeted solution that addresses the confirmed root cause.
- Explain why this fix resolves the issue and note any side effects or edge cases.

**7. Plan Comprehensive Verification**

- Define positive, negative, edge-case, and regression tests to ensure the fix works and introduces no new issues.

**8. Implement & Validate**

- Apply the fix in small, testable increments.
- Run automated tests, linters, and static analyzers.
- Diagnose and resolve any failures autonomously until tests pass or autonomy criteria require escalation.

**9. Summarize & Report Outcome**

- Provide a concise summary of:

  - **Root Cause:** What was wrong.
  - **Fix Applied:** The changes made.
  - **Verification Results:** Test and analysis outcomes.
  - **Next Steps/Recommendations:** Any remaining risks or maintenance suggestions.
