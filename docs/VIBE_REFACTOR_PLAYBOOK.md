# VIBE Refactor — Assignment Playbook (Synka)

Use this with **Module 1** `DEBT_AND_RISK.md` and your **GitHub PR** (not default AI PR summary).

---

## 1. Pick a target (from your inventory)

### Strong **low-risk** matches (isolated, well-defined I/O)

| Inventory item | Why it fits VIBE | Suggested **narrow** scope (one PR) |
|----------------|------------------|--------------------------------------|
| **Debt 4 — Inconsistent error handling** | Flagged as messy; fix **one slice** only | Add `getApiErrorMessage(error: unknown): string` in `mobile/SynkaApp/src/utils/` and use it in **one** screen (e.g. `SwitchWorkflowScreen` eligibility catch) + optional second call site |
| **Debt 2 — Hardcoded API config** | Medium debt; **partial** fix is OK | Add `getApiBaseUrl(): string` with validation + `__DEV__` comment; wire **only** `api/client.ts` (leave rest for later) |
| **Debt 5 — i18n** | Low blast radius | Replace **one** screen’s hardcoded `Alert` strings with `t('...')` + keys in `en.json`/`es.json` |

### Do **not** pick for this assignment

| Inventory item | Why |
|------------------|-----|
| **Debt 1 — Monolithic sync service** | Too large = not “isolated” |
| **Debt 3 — Entire test suite** | Scope explosion |
| **Auth flow / Prisma schema / “throughout” Debt 4** | Core architecture |

**In your PR:** Name the inventory item and section (e.g. *“DEBT_AND_RISK.md — Debt Item 4, narrowed to API error messaging in the switch workflow”*).

---

## 2. VIBE loop (what to document)

### V — Verify

- Ask AI for a refactor; **read the diff like a code review**, not like a blog post.
- **Verification event (10 pts):** You must cite **one** concrete case where AI suggested something **generic** and you **rejected or changed** it for **Synka** (e.g. wrong error shape, `any`, ignoring your backend’s `{ message, error }` JSON, suggesting Sentry when you said no new deps, etc.).

### I — Improve

- Add **type safety** (`unknown` + narrowing, not bare `any`).
- Add **defensive** handling (fallback message, log in dev only).

### B — Build

- `npm run lint` (mobile) and/or backend lint; **no new errors** in touched files.

### E — Execute

- Run app (or backend); **screenshot** or **terminal log** showing the flow (e.g. trigger error → see your new user-facing message).

---

## 3. PR description — paste into GitHub (replace brackets)

```markdown
### 🛡️ VIBE Report

1. **Target Selected:** [e.g. *Debt Item 4 (Inconsistent Error Handling) — narrowed to centralized parsing of API/Axios errors for the biosimilar switch eligibility step (`SwitchWorkflowScreen.tsx`). Low-risk: one utility + one screen; no auth, schema, or sync orchestration changes.*]

2. **The Verification Event:**  
   [Describe ONE specific moment, e.g.: *The AI suggested using only `error.message` for all failures. Our Express API returns structured JSON (`error.response?.data?.message`). I rejected the generic pattern and implemented a small type guard for `AxiosError` plus fallbacks for non-Axios throws, matching existing `client.ts` interceptors.*]  
   - **AI suggestion (summary or short quote):** [what you did NOT ship]  
   - **Final implementation:** [what you shipped — file/function names]

3. **Trust Boundary Established:**  
   [e.g. *Human-defined contract for “what the user sees” vs raw network errors; unknown errors narrowed safely; future screens can reuse the same helper without copying `catch (error: any)`.*]

4. **Evidence of Execution:**  
   [Attach screenshot(s) in PR or link; describe: e.g. *Airplane mode / bad token / 404 → alert text matches helper output.*]  
   **Build:** `npm run lint` (and/or `npm test` if you added a test) — paste relevant output snippet.

---

**Inventory reference:** `DEBT_AND_RISK.md` — [Debt Item #]
```

---

## 4. Rubric quick map

| Criterion | What graders look for |
|-----------|------------------------|
| Target (3) | Named in inventory + actually low-risk |
| Verification event (10) | **Specific** reject/correct AI; not “I read it” |
| Code quality (10) | Cleaner, typed, defensive; **no new lint noise** |
| PR doc (7) | All four VIBE sections filled; **not** generic Copilot summary |

---

## 5. Suggested first PR (optional concrete plan)

1. Branch: `refactor/vibe-api-error-helper`
2. Add `src/utils/apiErrorMessage.ts` with `getApiErrorMessage(error: unknown): string`
3. Replace **one** `catch (error: any)` block in `SwitchWorkflowScreen` (or similar) to use it
4. Run `cd mobile/SynkaApp && npm run lint`
5. Screenshot: trigger controlled error → alert text
6. Open PR with template above

*If your course requires the PR link only, submit that URL with any separate PDF your instructor requests.*
