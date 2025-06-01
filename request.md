{Your feature or change request here}

---

**1. Critical Clarification & Initial Questions**

Before writing any code, gather the essential details that only a human can provide to guarantee a correct implementation. Examples of critical questions:

- **Business Logic & Acceptance Criteria**

  - “What exact user action or workflow should this feature enable? (e.g., form fields, button behavior, page navigation)”
  - “Which edge cases must be supported? For instance, what should happen if a user submits invalid data or has no permissions?”
  - “Are there specific performance targets or SLAs for this feature (e.g., response within 200ms)?”

- **Data Contracts & API Expectations**

  - “What request parameters does the new API endpoint expect, and what’s the exact response schema? Please share sample payloads if available.”
  - “Which fields are required vs. optional? Should any new fields be indexed, or are there constraints (unique, required)?”

- **Integration Points & Dependencies**

  - “Which existing modules or services must this feature integrate with? For example, user authentication, payment processing, or analytics pipelines.”
  - “Are there shared utilities or helper functions that should be extended instead of rewriting? (e.g., existing email‐validation logic or date formatters).”

- **Authorization & Security**

  - “Who is allowed to access this feature? Describe required roles or permission checks.”
  - “Should any new sensitive data (passwords, tokens) be stored or transmitted? If so, what encryption or token policies apply?”

- **Cleanup & Code Ownership**

  - “Are there deprecated functions, modules, or styling patterns that should be removed as part of this task? Please point out any known dead/unused code zones.”
  - “Who owns the areas of code that we’re modifying? If we remove or refactor code, should we inform any specific team or document ownership changes?”

- **Documentation & User Communication**
  - “What end‐user documentation or UI copy must be updated? Provide exact text or links to documentation requiring edits.”
  - “Are there accessibility guidelines (ARIA labels, keyboard navigation, color contrast) we must follow for this feature?”

**Once these details are answered, confirm your understanding:**

> “To confirm: you’d like a `/api/auth/reset` endpoint that accepts `{ email: string }`, sends a reset token to the user’s email, and returns `{ status: 'sent' }`. We’ll remove the old `legacyResetEmail` function, update docs, and ensure only users with role `user` can access. Is that correct?”

**2. Deep Analysis & Research**

- **Gather Context**: Use available tools to locate relevant code, configuration files, documentation, or existing implementations.
- **Define Scope**: Enumerate affected modules, services, and integrations. Note any cross-file or cross-service dependencies.
- **Identify Dead/Unused Code**: Search for obsolete functions, commented-out code, or modules no longer in use that may be safely removed.
- **Formulate Approaches**: Outline multiple possible implementations. For each, evaluate feasibility, impact on existing code, and alignment with project conventions.

**3. Impact & Dependency Assessment**

- **Map Dependencies**: List upstream/downstream components, shared utilities, and third-party libraries involved.
- **Reuse & Consistency**: Identify existing patterns or helper functions that can be leveraged rather than reinventing.
- **Risk Evaluation**: Document potential failure modes, performance concerns, and security considerations. Note if any legacy code cleanup introduces risk.

**4. Strategy Selection & Autonomous Resolution**

- **Choose Optimal Path**: Select the approach that balances reliability, maintainability, and minimal disruption.
- **Resolve Ambiguities Independently**: If questions arise during research (e.g., “Which environment variable governs this behavior?”), consult documentation or code comments first. Only escalate if you hit a blocker that prevents safe progress.

**5. Execution & Implementation**

- **Pre-Change Verification**: Open all target files and associated tests to understand existing logic and side effects.
- **Clean Up Dead/Unused Code**: Remove any obsolete functions, imports, or modules identified earlier. Ensure that no feature or test depends on them.
- **Implement Core Edits**: Apply code changes or add new files using precise, workspace-relative paths.
- **Incremental Commits**: Break work into logical, self-contained commits (e.g., “refactor: remove legacy X,” then “feat: add new Y endpoint”). Each commit should pass tests on its own.

**6. Tool-Driven Validation & Autonomous Corrections**

- **Run Automated Tests**: Execute unit, integration, and E2E suites.
- **Lint & Type-Check**: Run ESLint/Prettier, `tsc --noEmit`, or equivalent static analysis.
- **Self-Heal Failures**: Diagnose and fix any broken tests, lint errors, or type issues until the suite passes fully.

**7. Verification & Reporting**

- **Comprehensive Testing**: Create or update test cases to cover positive, negative, edge, and security scenarios introduced by the change.
- **Cross-Environment Checks**: Verify in local “production” build (`npm run build && npm start`), and if applicable, staging or CI environments.
- **Result Summary**: Prepare a concise summary of:
  - What changed (features added, code removed).
  - How it was tested (tests added/updated, manual QA steps).
  - Key decisions (e.g., approach chosen, dead code removed).
  - Outstanding risks or recommendations (e.g., future deprecations).

**8. Safety & Approval**

- **Autonomous Changes**: Proceed without further confirmations for non-destructive code edits, dead code removal, and tests.
- **Escalation Criteria**: If encountering irreversible actions or conflicting requirements, provide a brief risk/benefit overview and ask for explicit approval before proceeding.

**9. Commit & Documentation**

- **Meaningful Commit Messages**:

  - Structure: `<type>(<scope>): <short description>`
    - **Type**: feat, fix, refactor, chore, docs, test.
    - **Scope**: the module or component affected (e.g., `auth`, `api`, `ui`).
    - **Short Description**: imperative, under 50 characters.
  - Body (if needed): Explain “why” vs. “what,” list notable changes, and reference related issues (e.g., “Closes #123”).
  - Example:

    ```
    feat(auth): add password reset endpoint

    - Introduce POST /api/auth/reset endpoint with Zod validation
    - Remove legacy resetEmail utility (no longer used)
    - Clean up dead code in auth/helpers.ts
    - Add unit tests and integration tests for new endpoint
    - Commit message follows Conventional Commits
    ```

- **Update Documentation**:
  - If you added new endpoints, update API docs or README.
  - Remove references to deleted code.
  - Add usage examples or code snippets if relevant.

**10. Push & Pull Request**

- **Push Branch**:
  ```bash
  git push origin feature/your-branch
  ```
