# Lab 4 — Agentic IDE Sprint Planning  
## Synka MVP Backlog

**Project:** Synka – Biosimilar Switch Kit MVP  

**Repository:** `synka-biosimilar-switch`  

**GitHub Project board:** [Synka MVP Backlog](https://github.com/users/basanta2029/projects/7/views/1)  

**Evidence of backlog state:** Team screenshots of the project board dated April 6, 2026.  

---

### Team roster

| Name | Role |
|------|------|
| Simon Armstrong | Scrum Leader / Point of Contact |
| Cameron Carter | Technical Lead |
| Basanta Baral | Backend Development |
| Sollomon Crowder | Frontend Engineer |
| Destin Gilbert | Frontend Engineer |

---

## Part 1 — Agent output (raw)

The following text is the **original, unedited** output produced by Cursor after the team provided repository context: the root `README.md`, `docs/ARCHITECTURE.md`, `AGENTS.md`, and screenshots of the Synka MVP Backlog. This section is preserved **verbatim in substance** so it can be compared directly to the team’s revised plan in Parts 2 and 3.

### Sprint goal suggested by the agent

The agent proposed a sprint goal of shipping every item currently placed in the **Sprint 6** and **In Progress** columns: finishing remaining work on **SMS Notifications (#38)** and **Push Notifications (#3)**, closing **Bug Fixes from Testing (#45)**, completing **UI Polish & Error Handling (#46)** and **Localization Completion (#47)**, and delivering **Documentation (#53)** so the MVP is ready for the final demonstration. The agent also included **iOS App Support (#2)** in the committed scope because that epic appeared in the Sprint 6 column on the board.

### Sprint backlog candidates suggested by the agent

| Reference | Work item (as labeled on the board) | Why the agent included it |
|-----------|----------------------------------------|---------------------------|
| **#38** | F7: SMS Notifications (Epic) | Complete the notifications epic. |
| **#3** | F9: Push Notifications (Epic) | Users expect push; start in parallel. |
| **#46** | F5.2: UI Polish & Error Handling (5 points) | Improve quality before the demo. |
| **#47** | F5.3: Localization Completion (3 points) | Satisfy bilingual product expectations. |
| **#45** | F6.2: Bug Fixes from Testing (8 points, P0) | Stabilize the product after testing. |
| **#53** | F0.1: Documentation | Provide material for graders and handoff. |
| **#2** | F10: iOS App Support (Epic, P3) | Treat as in-scope because the card sits in Sprint 6. |

### Risks and dependencies suggested by the agent

The agent noted that SMS and push notification work might overlap and could share abstractions. It suggested running localization and UI polish in parallel because both touch user-facing screens. It acknowledged that bug fixes might grow if testing surfaces new regressions. It classified iOS as a lower-priority label but still present in the sprint column, and recommended treating it as stretch work. It proposed that documentation could be written continuously by the Scrum Lead.

### Limitations of the raw agent plan (why it was not adopted as-is)

The agent treated **every card** in the Sprint 6 and In Progress columns as an equal commitment, without questioning whether column placement reflected a realistic team promise for one academic sprint. It did not clearly **order** P0 bug work relative to feature work. Dependencies were described only in general terms; for example, it did not state that documentation should track a **stable** demo story rather than a moving target. Large epics such as **iOS (#2)** and **Push (#3)** were left in the same sprint bucket as **SMS (#38)** and polish work, which risks missing a **demo-ready Android vertical slice** within the available time. Finally, the agent did not assign **named owners** to each backlog item, which the course rubric expects for accountability.

---

## Part 2 — Human revised plan

The team reviewed the agent output and revised it before committing to a final sprint. This section documents what changed and why.

### How we interpreted the GitHub board

A board column shows workflow status, not guaranteed sprint commitment. **#2 iOS App Support** is a **P3-Low** epic and would over-commit the team during demo prep. **Decision:** move iOS out of this sprint and keep focus on Android MVP readiness.

### How we prioritized notification work

**#3 Push Notifications** is **P2-Medium**, while **#38 SMS Notifications** is **P1-High** and already in progress. Running both channels in one sprint splits testing and integration effort. **Decision:** defer push and finish SMS first.

### How we ordered bug fixes, polish, localization, and documentation

**#45 Bug Fixes from Testing** is **P0-Critical**. We start with triage and P0 fixes, then run a second stabilization pass after SMS/UI merges.

**#46 UI Polish** and **#47 Localization** touch the same screens. Doing localization before UI stabilization causes rework. **Decision:** polish first, then localize demo-path screens.

**#53 Documentation** must match the actual demo build. **Decision:** Simon leads, with technical inputs from Cameron, Basanta, Sollomon, and Destin, and finalizes documentation in the second half of the sprint.

### Summary of changes from the raw agent output to the human plan

| Topic | What the agent suggested | What the team decided instead |
|--------|---------------------------|-------------------------------|
| **iOS (#2)** | Include because it appears in Sprint 6 | **Exclude** from this sprint; backlog until Android MVP is firm |
| **Push (#3)** | Work in parallel with SMS | **Defer** until after SMS epic **#38** is done |
| **Polish vs. localization** | Parallelize | **Polish (#46) first**, then **localization (#47)** on the demo path |
| **Bug fixes (#45)** | List as a task | **Two-pass** stabilization: early triage plus regression after major merges |
| **Documentation (#53)** | Write continuously | **Concentrate in the second half** of the sprint with engineering input |
| **Overall goal** | Ship everything visible in key columns | Deliver a **demo-ready Android slice**, stable enough to document |

---

## Part 3 — Final sprint scope, dependencies, and ownership

### Final sprint goal

**This sprint, the team commits to delivering a demo-ready Android experience:** SMS notifications (**#38**) completed and verified on the demo path, critical defects from testing (**#45**) triaged and resolved under a timeboxed process, user-facing polish and error handling (**#46**) completed for demo screens, localization (**#47**) applied to those same screens after they are stable, and documentation (**#53**) updated so instructors and judges can run and understand the system. **iOS (#2)** and **push notifications (#3)** are explicitly **not** part of this sprint commitment.

### Final sprint backlog (simple table)

The table below keeps the sprint scope concise and readable while preserving the key board fields requested in the assignment.

| Issue | Title | Priority | Story points | Owner |
|-------|-------|----------|--------------|-------|
| **#45** | F6.2: Bug Fixes from Testing | P0-Critical | 8 | Cameron Carter (lead), Basanta Baral, Sollomon Crowder, Destin Gilbert |
| **#38** | F7: SMS Notifications | P1-High | Not shown on epic card | Cameron Carter, Basanta Baral |
| **#46** | F5.2: UI Polish & Error Handling | P1-High | 5 | Sollomon Crowder, Destin Gilbert |
| **#47** | F5.3: Localization Completion | P1-High | 3 | Destin Gilbert (lead), Sollomon Crowder |
| **#53** | F0.1: Documentation | P1-High | Not shown on card | Simon Armstrong (lead), Cameron Carter, Basanta Baral |

### Work explicitly out of scope for this sprint

| Issue | Title | Explanation |
|-------|--------|-------------|
| **#2** | F10: iOS App Support | This is a lower-priority epic and would divert effort from the Android demonstration the course expects this term. |
| **#3** | F9: Push Notifications | Push is lower priority than SMS on the board; the team finishes SMS first. |
| **#4, #5, #6** | F11–F13 (Multi-Clinic, Digital Consent, Advanced Reporting) | These remain future product backlog items and are not committed for this sprint. |

### Dependency narrative (how the work flows)

The sprint starts with **#45** triage/fixes, then executes **#38 SMS** with backend and mobile ownership. After SMS changes settle, the team completes **#46 UI polish** on demo screens, then **#47 localization** for those same screens. **#53 documentation** is finalized after behavior is stable.

### Risks and mitigation

- **SMS setup risk:** third-party delivery could fail during demo. Mitigation: use a tested staging path, keep fallback evidence in `#53`, and run a manual pre-demo verification. Owner: Cameron (with Basanta).
- **Scope growth in #45:** bug list may expand. Mitigation: timebox triage, prioritize P0/P1, and defer lower-priority defects with notes.
- **Localization rework:** copy may change late. Mitigation: freeze demo-path strings after `#46`.
- **Demo instability:** late merges can break the build. Mitigation: short code freeze and smoke test before presentation.

### Definition of Done for this sprint

- **#38 SMS:** MVP SMS behavior works on the demo path and is manually verified; verification notes are documented.
- **#45 Bugs:** no open P0 defects on demo-critical flows; remaining P1 items are fixed or explicitly deferred with owner/date.
- **#46 and #47:** demo-path screens meet issue acceptance criteria and final language expectations.
- **#53 Docs:** setup, demo steps, and known limitations are documented clearly.
- **Board alignment:** `#2` and `#3` remain out of sprint scope unless formally replanned.

---

## Appendix — Board columns as captured from team screenshots (April 6, 2026)

This appendix ties the written plan to the evidence the team submitted. The **Backlog** column contained **#4** (F11 Multi-Clinic Support), **#5** (F12 Digital Consent Signatures), and **#6** (F13 Advanced Reporting & Export). The **Sprint 6** column contained **#45** (F6.2 Bug Fixes from Testing), **#47** (F5.3 Localization Completion), **#2** (F10 iOS App Support), and **#53** (F0.1 Documentation). The **In Progress** column contained **#38** (F7 SMS Notifications), **#46** (F5.2 UI Polish & Error Handling), and **#3** (F9 Push Notifications). The **Review** column was empty. The **Done** column included completed work such as End-to-End Testing (F1.1), **#8** (F1 Foundation & Setup), **#14** (F2 Patient Management), **#20** (F3 Biosimilar Switch Workflow), **#26** (F4 Appointments & Follow-ups), and **#31** (F8 Dashboard & Analytics), as shown in the screenshots.

---

*End of document.*
