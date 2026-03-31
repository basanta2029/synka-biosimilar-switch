# Requirements Traceability Matrix (RTM) - Updated for Module 5 Sprint 6

## Project
Synka - Biosimilar Switch Kit (MVP)

## Team Members (Initials)
- SA - Simon Armstrong (Scrum Leader & Primary POC)
- CC - Cameron Carter (Technical Lead)
- BB - Basanta Baral (Backend Developer)
- SC - Sollomon Crowder (Frontend Engineer)
- DG - Destin Gilbert (Frontend Engineer)

---

## Feature-to-Requirement Mapping (same core structure)

| Requirement ID | Requirement Description | Module / Feature | Primary Owner(s) |
|---|---|---|---|
| R1 | System must support offline infusion scheduling. | F1. Offline Scheduling Module | SA, CC |
| R2 | System must send automated reminders via SMS/IVR. | F2. Reminder System (SMS/IVR) | BB |
| R3 | System must support biosimilar switching (eligibility, consent, verification). | F3. Biosimilar Consent & Eligibility | CC, BB |
| R4 | Doctors must be able to review intake info asynchronously. | F4. Store-and-Forward Review Module | SC |
| R5 | Clinic admin must track adherence and no-shows. | F5. Adherence Tracking System | DG |
| R6 | CHWs must receive escalation alerts for adverse reactions. | F6. Symptom Reporting & Escalation | SA |
| R7 | System must support reliable offline data synchronization. | F7. Offline Data Sync Engine | SA, CC, BB |
| R8 | Program managers must view outcomes, cost savings, and event metrics. | F8. Analytics Dashboard | BB |

---

## Sprint 6 Traceability Additions (Module 5 requirement)

This section adds the sprint backlog evidence required by Module 5 while keeping the original RTM mapping intact.

| RTM Req ID | Feature ID | Backlog / Task ID | GitHub Issue | Sprint | Status | Owner | Evidence |
|---|---|---|---|---|---|---|---|
| R1 | F1 | E2E Validation | #44 | Sprint 6 | Done | Team | #44 closed with checklist complete |
| R3 | F3 | TASK-3.2 Ghana brand medication list alignment | #3.1.1 | Sprint 6 | Done | BB | Linked under Sprint 6 completed work; validated in app flow |
| R7 | F7 | TASK-6.5 Sync and API reliability fixes | #6.1.1 | Sprint 6 | Done | BB | Linked under Sprint 6 completed work; validated with sync/API checks |
| R8 | F8 | E2E dashboard validation | #44 | Sprint 6 | Done | Team | #44 acceptance criteria includes dashboard metrics check |

---

## Notes for Submission

- This updated RTM keeps the original requirement-to-feature structure.
- It adds sprint-level traceability from backlog items to completion evidence.
- IDs `#3.1.1` and `#6.1.1` are included as completed Sprint 6 tasks and owned by **BB**.
