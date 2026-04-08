# Lab 6 — Lovable.dev Feature Extension Plan (Synka)

## 1) Recommended feature for this assignment

**Selected feature:** `#46 F5.2 UI Polish & Error Handling` (with optional tie-in to `#47 Localization Completion`).

### Why this is the best fit for Lovable.dev
- Lovable is strongest for **UI refinement**, component consistency, and interaction polish.
- `#46` is already in active work and has clear value for final presentation quality.
- This feature can be integrated safely without rewriting backend architecture.
- It supports the rubric category “Feature Value & Relevance” better than trivial cosmetic-only edits.

### Scope boundary (to prevent overreach)
- In scope: selected demo-path screens only (e.g., auth flow, patient list/detail, switch workflow summary, dashboard cards).
- Out of scope: full iOS support, new notification channels, major data-model refactors.

---

## 2) Acceptance criteria for implementation

Use these as your implementation target and PR checklist.

1. Demo-path screens have consistent visual hierarchy (spacing, typography, button states, and error styles).
2. Error and loading states are present and readable on all selected screens.
3. Existing backend behavior is unchanged (no API contract break).
4. Existing navigation flow is preserved.
5. Lint/build/test pass for touched modules.
6. Team review confirms maintainability (no large duplicated generated blocks).

---

## 3) Step-by-step execution workflow (what your team should do)

## Step A — Baseline capture (Before)
- Create branch: `feature/lab6-lovable-ui-polish`
- Record baseline screenshots/videos of selected screens.
- Note existing components and files touched by those screens.
- Save this baseline evidence for PR “Before” section.

## Step B — Targeted generation in Lovable.dev
- Prompt Lovable with narrow scope: “Refine UI and error states for these specific screens only; preserve data contracts and navigation.”
- Generate only the screens/components in scope.
- Export code and isolate generated changes in a temporary folder.

## Step C — Clean integration into GitHub repo
- Merge generated UI changes selectively (do not blindly replace entire folders).
- Keep current architecture conventions and file structure.
- Manually remove duplicated components or dead generated code.
- Ensure naming and imports match your existing project patterns.

## Step D — Verification
- Run project build/lint/tests.
- Manually test the selected user flow from start to finish.
- Verify no regression in login, patient workflow, switch workflow, and dashboard path used in demo.
- Capture “After” screenshots/videos.

## Step E — Pull Request creation
- Open PR with a **detailed Before/After** summary.
- Include explicit list of files changed and why.
- Include verification evidence and known limitations.

---

## 4) Suggested ownership (based on your team roles)

| Workstream | Owner | Support |
|------------|-------|---------|
| Lovable prompt design + UI direction | Sollomon Crowder | Destin Gilbert |
| Integration and code cleanup | Sollomon Crowder | Cameron Carter |
| Regression verification on API-connected flows | Basanta Baral | Cameron Carter |
| PR narrative + rubric completeness check | Simon Armstrong | Whole team |

---

## 5) Risk register + mitigations

| Risk | Mitigation |
|------|------------|
| Lovable overwrites architectural improvements | Integrate file-by-file, not folder replacement |
| Generated code duplicates existing components | Refactor to reuse existing shared components |
| Hidden regression in user flow | Mandatory manual end-to-end test on demo path |
| PR too vague for rubric | Use explicit Before/After table and acceptance criteria checklist |

---

## 6) PR description template (copy/paste)

**Title:** `lab6: lovable UI polish integration for #46`

## Summary
This PR integrates Lovable.dev-generated UI refinements for `#46 F5.2 UI Polish & Error Handling` on selected demo-path screens. The goal is to improve usability and presentation quality while preserving current architecture and behavior.

## Feature selection rationale
We selected `#46` because it is high-impact for final presentation quality and is well-suited for Lovable’s strengths in rapid UI iteration.

## Before vs After (required)
| Area | Before | After | Source of change |
|------|--------|-------|------------------|
| Screen A | [Describe baseline] | [Describe result] | Lovable + human cleanup |
| Screen B | [Describe baseline] | [Describe result] | Lovable + human cleanup |
| Error states | [Inconsistent/missing] | [Consistent standardized states] | Human refinement |
| Loading states | [Current behavior] | [Improved behavior] | Lovable + manual edits |

## Files changed (high level)
- `mobile/SynkaApp/src/...`
- `mobile/SynkaApp/src/components/...`
- `mobile/SynkaApp/src/screens/...`

## Verification evidence
- [ ] App builds successfully
- [ ] Lint/tests pass for touched modules
- [ ] Manual flow check completed (auth -> patient -> switch -> dashboard)
- [ ] No API contract changes introduced
- [ ] Before/After screenshots attached

## Stability notes
No backend contract changes. Navigation and data flow remain compatible with current architecture.

## Known limitations
- [List any intentionally deferred polish]

## Checklist
- [ ] Team reviewed generated code quality
- [ ] Removed duplicated/unnecessary generated code
- [ ] Updated docs if behavior/text changed

---

## 7) What to submit to Canvas

Submit **one PDF** that contains:
1. Link to merged or review-ready PR.
2. PR description with full Before/After table.
3. Verification evidence summary.
4. Team confirmation that integration did not break existing behavior.

Recommended filename: `LAB6_LOVABLE_PR_DOCUMENTATION_TEAM.pdf`
