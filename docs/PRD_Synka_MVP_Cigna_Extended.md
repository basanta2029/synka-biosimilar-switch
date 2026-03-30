## Synka – Biosimilar Switch Kit v1.0
## Comprehensive Product Requirements Document (Cigna-Ready MVP)

---

### 1. Executive Summary

**Product Vision**  
Synka is a mobile-first, offline-capable healthcare application that enables clinics in emerging markets to safely transition patients from expensive brand-name biologic medications to clinically-equivalent biosimilars. It supports clinic staff through a guided workflow, automated follow-ups, and SMS-based communication, while giving Cigna and clinic administrators visibility into safety, adherence, and cost savings.

**Primary Objective**  
Deliver a **clinically-safe, auditable, offline-first biosimilar switch program** that Cigna could pilot with real clinics:
- From **patient registration** to **switch initiation**, **follow-ups**, and **outcome tracking**.
- With **measurable cost savings** and **follow-up completion rates**.
- With **security, auditability, and reliability** that can pass a payer’s technical and security review.

---

### 2. Scope & Release Plan

#### 2.1 In-Scope for This Version

- **Mobile app (React Native)**
  - Patient management (register, search, history).
  - Guided **switch workflow wizard** (eligibility → biosimilar selection → scheduling → consent → summary).
  - Offline-first operation with **SQLite + sync** across patients, switches, appointments, and follow-ups.
  - Appointment & follow-up management (including day‑3/day‑14 forms).
  - Localized UI (English/Spanish).

- **Backend (Node + Express + Prisma + Postgres)**
  - APIs for users, patients, drugs, switches, appointments, follow-ups, SMS, sync, and dashboard metrics.
  - Eligibility and cost-saving rules enforced on the server.
  - SMS sending via Twilio with English/Spanish templates.
  - Basic RBAC and audit logging (per-user actions).

- **Web dashboard (minimum viable)**
  - Read-only views for key KPIs: switch counts, follow-up completion, cost savings, alerts.

#### 2.2 Out of Scope (Future)

- Deep integration with Cigna internal systems (claims, benefits, EMR).
- Advanced workflow customization per clinic (beyond simple config flags).
- Non-SMS patient apps or portals.
- Multi-country regulatory configuration (assume single jurisdiction baseline).

---

### 3. Target Users & Roles

#### 3.1 Clinic Nurse (Primary Mobile User)

- Registers patients, initiates switches, schedules and records follow-ups.
- Needs simple, offline-capable flows with minimal typing and clear error messages.

#### 3.2 Physician

- Reviews eligibility, approves/overrides switches, reviews adverse events.
- Uses both mobile (or tablet) and web dashboard.

#### 3.3 Clinic / Cigna Admin

- Uses web dashboard only.
- Needs cost savings, safety, and adherence metrics; exportable for reporting.

#### 3.4 System Roles

- `nurse` – can manage patients, start switches, log follow-ups, but cannot override eligibility or see system-level metrics.
- `doctor` – all nurse abilities **plus** override eligibility and complete/cancel switches.
- `admin` – all doctor abilities **plus** access to admin endpoints, metrics, and exports.

---

### 4. High-Level Functional Epics

1. **Patient Management**
2. **Biosimilar Switch Workflow Wizard**
3. **Appointments & Follow-Ups**
4. **Offline-First & Sync Engine (Multi-Entity)**
5. **SMS Communication & Alerts**
6. **Dashboard & Analytics**
7. **Authentication, RBAC, and Audit Logging**
8. **Localization & UX Consistency**

Each epic below includes **backend**, **mobile**, and **acceptance criteria** details.

---

### 5. Epic 1: Patient Management

#### 5.1 Features

1. **Patient Registration**
   - Fields:
     - Full Name (2–100 chars, required)
     - Phone (`+[country code][number]` or 10–15 digits; required; unique per clinic)
     - Date of Birth (required; must imply age ≥ 18 for switch eligibility)
     - Preferred Language (`EN` / `ES`, required, default EN)
     - Known Allergies (comma-separated codes or free text; optional)
   - Behavior:
     - Validates phone format.
     - Warns on duplicate phone number, but allows override with explicit confirmation.
     - Works offline: writes patient to SQLite with `synced=false` and queues for sync.
     - Shows confirmation: **“Saved locally – will sync when online.”**

2. **Patient Search & List**
   - Search by:
     - Partial name (case-insensitive).
     - Partial phone.
   - Offline search (against SQLite).
   - Visual indicators:
     - Global online/offline status indicator.
     - Badge for unsynced patients (`synced=false`).
     - Language badge (EN/ES).
   - Patient list card shows:
     - Name, age, phone, language, and allergy highlights where applicable.

3. **Patient Detail & History**
   - Displays:
     - Demographics: name, phone, DOB, language, allergies.
     - Switch history: list of switches with status badges (`PENDING`, `COMPLETED`, `CANCELLED`, `FAILED`).
     - Upcoming appointments count.
   - Tapping a switch opens its detail screen with appointments and follow-ups.

#### 5.2 Implementation Notes

- **Backend**
  - `Patient` model with unique phone constraint.
  - CRUD endpoints already defined; enforce validation and duplicate phone warning behavior in controller/service.

- **Mobile**
  - `patientsDb` stores all registration fields.
  - `usePatients` hook supports debounced search and offline-first reads.

#### 5.3 Acceptance Criteria

- [ ] Register, search, and view patients fully offline, then successfully sync when backend becomes available.
- [ ] Duplicate phone flow warns but allows override; resulting patients remain consistent between device and server.
- [ ] Patient detail reliably shows switch history and upcoming appointment count once other epics are implemented.

---

### 6. Epic 2: Biosimilar Switch Workflow Wizard

#### 6.1 Step 1 – Eligibility Check

**User Story**: As clinic staff, I want to check eligibility before proceeding so that switches are safe.

**Rules** (must all be satisfied unless overridden by a doctor):
- Age ≥ 18.
- No history of severe allergies to current drug.
- Stable on current drug for ≥ 3 months.
- Current drug is a brand biologic, not already a biosimilar.

**Backend**

- Endpoint: `POST /api/v1/switches/eligibility`
  - Request:  
    ```json
    { "patientId": "string", "currentDrugId": "string" }
    ```
  - Response:  
    ```json
    {
      "eligible": true,
      "reasons": [],
      "patientSnapshot": { },
      "drugSnapshot": { }
    }
    ```
  - If `eligible=false`, `reasons` includes explicit codes/messages (for example: `"UNDER_18"`, `"ALLERGY_HISTORY"`, `"UNSTABLE"`, `"ALREADY_BIOSIMILAR"`).
- Implement rule engine in `switchService.checkEligibility`, with unit tests per rule and combined rule set.

**Mobile**

- From `PatientDetail`, “Start Switch” button opens `SwitchWorkflowScreen`.
- Step 1 UI:
  - Select current drug (from patient’s current treatment or from a list).
  - Calls `/switches/eligibility`.
  - Shows:
    - Green check and **“Patient eligible”** if all rules pass.
    - Red X with list of reasons if not eligible.
  - If user role is `doctor`:
    - Show **“Override eligibility”** button requiring:
      - Free-text reason (min 10 chars).
      - Audit log entry on backend with override reason and user ID.

**Acceptance**

- [ ] Eligibility rules implemented and tested on backend.
- [ ] Overrides require `doctor` or `admin` role and a non-empty reason; backend records override details and audit log entry.

---

#### 6.2 Step 2 – Biosimilar Selection & Cost Comparison

**User Story**: As staff, I want to see biosimilar options and savings to explain to patients and Cigna.

**Backend**

- `Drug` model includes:
  - Type (`BRAND` / `BIOSIMILAR`), therapeutic class, monthly cost (numeric), approval flags (`approvedForSwitch`, etc.).
- Endpoint: `GET /api/v1/drugs/switch-options?fromDrugId=...`
  - Returns:
    - Current drug details.
    - List of eligible biosimilars with:
      - Name, manufacturer, monthly cost.
      - Computed savings per month & per year.
      - Approval flags for switch.

**Mobile**

- Step 2 UI:
  - Top card: current drug name, type, monthly cost.
  - List of biosimilars:
    - Name, monthly cost, savings absolute and percentage.
    - Default sort: highest savings; toggle for alphabetical.
  - Tap biosimilar → detail modal with **“Select this drug”**.

**Acceptance**

- [ ] Savings calculations match backend-calculated values (no drift between app and API).
- [ ] Only biosimilars in same therapeutic class & flagged as approved for switch are listed.

---

#### 6.3 Step 3 – Appointment Scheduling

**User Story**: As staff, I want structured initial/day‑3/day‑14 follow-ups scheduled automatically.

**Backend**

- `Appointment` model:
  - `type`: `INITIAL`, `DAY_3`, `DAY_14`
  - `status`: `SCHEDULED`, `COMPLETED`, `NO_SHOW`, `CANCELLED`
  - `datetime`, `patientId`, `switchId`
- Endpoints:
  - `POST /api/v1/appointments/bulk-create` – creates the three appointments tied to a switch.
  - `GET /api/v1/appointments` – filter by date range, status, patient, and type.
  - `PUT /api/v1/appointments/:id` – update status and datetime.

**Mobile**

- Step 3 UI:
  - Date/time pickers:
    - Initial date (default today), time.
    - Day‑3 and Day‑14 auto-calculated and can be adjusted within rule constraints.
  - Validation:
    - Initial date not in the past.
    - Day‑3 ≥ 2 days after initial.
    - Day‑14 ≥ 13 days after initial.
- Data handling:
  - Local inserts into SQLite with `synced=false` and queue entries.
  - If online, also send to bulk-create endpoint immediately.

**Acceptance**

- [ ] App enforces scheduling constraints.
- [ ] Appointments created while offline are synced correctly and appear on server with proper types and timestamps.

---

#### 6.4 Step 4 – Consent Capture

**User Story**: As staff, I want to explicitly record patient consent so that the switch is documented.

**Backend**

- Endpoint: `POST /api/v1/switches/:id/consent`
  - Request:
    ```json
    {
      "consentObtained": true,
      "consentText": "Localized consent text plus staff notes"
    }
    ```
  - Response: updated `switch` record plus status message.
- `SwitchRecord` model fields:
  - `consentObtained`, `consentText`, `consentTimestamp`, `consentStaffId`.

**Mobile**

- Step 4 UI:
  - Shows patient name and drugs: **“I agree to switch from [Brand] to [Biosimilar]”** in the patient’s language.
  - Required checkboxes:
    - “Patient verbally confirmed understanding.”
    - “Patient signed consent form.”
  - Optional notes (0–1000 chars).
- Offline handling:
  - Record consent locally and enqueue a `switch` sync operation (`updateConsent`).

**Acceptance**

- [ ] User cannot proceed without required checkboxes checked.
- [ ] Consent data (obtained flag, text, timestamps, staff ID) is consistent between device and server.

---

#### 6.5 Step 5 – Summary & Submission

**Behavior**

- Summary screen shows:
  - Patient info.
  - From → To drug plus monthly/yearly savings.
  - Appointment list (initial, day‑3, day‑14).
  - Consent status and key flags.
- On “Submit”:
  - Creates or updates:
    - `SwitchRecord`.
    - The three appointments.
    - SMS schedule entries for each appointment (or marks them to be scheduled by backend).
  - If offline:
    - Writes all entities to local DB and sync queue.
    - Shows: **“Switch created locally – will sync when online.”**

**Acceptance**

- [ ] After submission, Patient Detail shows the new switch in history with correct status and appointments.
- [ ] If device was offline during entire wizard, all data appears correctly after first successful sync.

---

### 7. Epic 3: Appointments & Follow-Ups

#### 7.1 Appointment Management

**Mobile**

- `AppointmentsScreen`:
  - Tabs or filters: `Upcoming`, `Completed`, `Missed`.
  - Group by date; each item showing patient name, type (INITIAL/DAY_3/DAY_14), time, and status badge.
  - Tap appointment:
    - See details and actions:
      - Mark as `COMPLETED` → for DAY_3 or DAY_14, opens follow-up form.
      - Mark as `NO_SHOW` → optional note and confirmation.
      - Reschedule (adjust date/time) if allowed.

**Backend**

- Appointment endpoints (see 6.3) fully implemented with validation and audit logging.

#### 7.2 Follow-Up Forms

**Day‑3 & Day‑14 follow-up forms**

- Fields:
  - Symptoms (multi-select or free text).
  - Any adverse events? (`yes` / `no`).
  - Severity (`NONE` / `MILD` / `MODERATE` / `SEVERE`).
  - Adherence (missed doses? yes/no, notes).
  - Free-text notes (0–1000 chars).

**Backend**

- `FollowUp` model:
  - `type`: `DAY_3`, `DAY_14`
  - `severity`: severity enum
  - Links to `Appointment` and `SwitchRecord`.
- Endpoints:
  - `POST /api/v1/follow-ups` – create new follow-up tied to appointment.
  - `GET /api/v1/follow-ups?appointmentId=` – fetch existing follow-up.
- If severity is `SEVERE`, create `Alert` linked to patient, switch, and follow-up.

**Acceptance**

- [ ] Completing DAY_3 or DAY_14 follow-up updates appointment status and creates a `FollowUp` on server (or in sync queue when offline).
- [ ] Severe follow-ups reliably create `Alert` entities visible in dashboard APIs.

---

### 8. Epic 4: Offline-First & Sync Engine (Multi-Entity)

#### 8.1 Entities to Support

- `patient`
- `switch`
- `appointment`
- `followUp`

#### 8.2 Sync Queue Design

- Extend `SyncQueueItem`:
  - `entityType`: `'patient' | 'switch' | 'appointment' | 'followUp'`
  - `action`: `'create' | 'update' | 'delete' | 'updateConsent'` (extensible)
  - `payload`: JSON string with entity data to send to server.
  - `retryCount`, `lastError`, timestamps.

- `syncService.syncItem` behavior:
  - Branch on `entityType` and delegate to:
    - `syncPatient`, `syncSwitch`, `syncAppointment`, `syncFollowUp`.
  - Each handler:
    - Calls appropriate API (create/update/delete).
    - Handles 404/409 behavior (e.g., duplicates, already deleted).
    - Marks local records as synced or cleans them up.

#### 8.3 Backend `/sync` Endpoint

- Endpoint: `POST /api/v1/sync`
  - Accepts a batch of operations from device.
  - Processes them grouped logically (for example, per patient or per switch) to avoid partial inconsistencies.
  - Returns per-item results: success, conflict, or error with messages.

#### 8.4 Conflict Resolution Rules

- Rules (documented and implemented):
  - For scalar fields: “latest `updatedAt` wins” between device and server.
  - For deletes:
    - If entity deleted on device but updated on server later, treat delete as final unless an explicit conflict resolution policy is added.
- Errors:
  - Non-recoverable errors (for example, patient already exists by phone) trigger cleanup on device as you already do for duplicate patients.

**Acceptance**

- [ ] All listed entities can be created/updated/deleted offline and converge with server after reconnect.
- [ ] Sync logs show success/failure counts; device UI reflects pending count and last sync time.

---

### 9. Epic 5: SMS Communication & Alerts

#### 9.1 SMS Scheduling

**Backend**

- `SmsLog` model:
  - `to`, `body`, `language`, `templateId`, `status`, `error`, `sentAt`, `deliveredAt`, `messageSid`.
- Endpoints:
  - `POST /api/v1/sms/schedule` – create SMS log entries tied to appointments or switches, with target send times.
  - `POST /api/v1/sms/webhook` – Twilio webhook that updates `status`, `deliveredAt`, and `error` fields.

#### 9.2 SMS Templates

- English/Spanish templates stored on server (DB table or config) for:
  - Appointment reminders (initial/day‑3/day‑14).
  - Follow-up prompts.
  - Adverse event guidance messages.
- Each SMS includes:
  - Readable date/time (localized).
  - Clinic contact number.

#### 9.3 Two-Way SMS (Optional but Recommended)

- Handle basic reply codes via Twilio webhook:
  - `1` → confirms appointment, update appointment status accordingly.
  - `2` → requests reschedule (flag for staff to follow up).
  - `HELP` → creates an `Alert` and optionally notifies admin/doctor.

**Acceptance**

- [ ] SMS actions are logged with Twilio delivery statuses.
- [ ] Appointment reminders are scheduled and logged using backend templates and appear in SmsLog.

---

### 10. Epic 6: Dashboard & Analytics

#### 10.1 Metrics API

**Backend**

- Endpoint: `GET /api/v1/dashboard/metrics`
  - Returns:
    - Total switches, by status.
    - Day‑3 and Day‑14 follow-up completion rates.
    - Total cost savings and average per patient.
    - Number of severe alerts in last 30 days.
- Endpoint: `GET /api/v1/dashboard/recent-switches`
  - Recent switches with patient, drugs, status, and timestamps.
- Endpoint: `GET /api/v1/dashboard/alerts`
  - List severe alerts with filters (date range, severity, clinic).

#### 10.2 Web Dashboard (MVP)

- A small React app with:
  - Cards for key KPIs above.
  - Tables for recent switches and alerts.
  - Date-range filters (for example, last 30/90 days).

**Acceptance**

- [ ] Metrics align with definitions in original MVP PRD (completion rates, cost savings).
- [ ] Admin can visually confirm program impact for a pilot population.

---

### 11. Epic 7: Authentication, RBAC, and Audit Logging

#### 11.1 Authentication & Roles

**Backend**

- `User` includes `role: 'nurse' | 'doctor' | 'admin'`.
- All patient/switch/appointment/follow-up routes require JWT auth.
- Middleware enforces role permissions:
  - `nurse` – cannot call override endpoints or admin metrics.
  - `doctor` – can override eligibility, mark switches as complete/cancelled.
  - `admin` – can access dashboard endpoints and admin operations.

#### 11.2 Audit Logging

- `AuditLog` model:
  - `userId`, `action`, `entityType`, `entityId`, `metadata`, `timestamp`.
- Logged events include:
  - Patient create/update/delete.
  - Switch create/consent/complete/cancel.
  - Appointment status changes and reschedules.
  - Follow-up submissions.
  - Manual SMS sends and important configuration changes.

**Acceptance**

- [ ] Sensitive endpoints are correctly restricted per role.
- [ ] Audit logs can be queried via an admin endpoint to show who did what and when.

---

### 12. Epic 8: Localization & UX Consistency

#### 12.1 Localization

- All user-facing strings are moved to i18n dictionaries (EN, ES).
- Dates and times formatted according to locale.
- SMS templates localized via backend configuration.

#### 12.2 UX Guidelines

- Primary nurse flows:
  - Register patient → Start switch → Complete follow-ups.
  - Reachable within at most 2 taps from the main screen.
- Clear offline indicators:
  - Global indicator (Online/Offline).
  - Per-entity unsynced badges where relevant.
  - Clear network error messages tying failures to connectivity or backend availability.

---

### 13. Non-Functional Requirements

- **Performance**
  - Mobile screens load within 1s for local data and generally <2s when hitting server on typical clinic connectivity.
  - Sync batch operations do not block the UI; they run in background with user feedback (e.g., spinner + pending count).

- **Reliability**
  - Target ≥95% sync success rate under normal use.
  - No data loss during offline→online transitions in standard flows.

- **Security**
  - All external API traffic uses HTTPS in non-dev environments.
  - PHI is encrypted at rest (via infrastructure) and SQLite is protected to the extent feasible on device.
  - JWT and other credentials stored securely on device (e.g., secure storage utilities).

---

### 14. Recommended Implementation Order

1. **Backend foundations**
   - Confirm models for `User` (roles), `Patient`, `Drug`, `SwitchRecord`, `Appointment`, `FollowUp`, `SmsLog`, `Alert`, `AuditLog`.
   - Enforce auth and RBAC on all PHI-related endpoints.

2. **Offline & sync engine extension**
   - Extend `SyncQueueItem` and `syncService` to support `switch`, `appointment`, and `followUp`.
   - Implement `/api/v1/sync` batch endpoint on backend.

3. **Switch workflow backend**
   - Finalize `switchService` and related controllers for eligibility, switch creation, consent, complete/cancel.
   - Implement `drugs/switch-options` endpoint and cost-saving calculation logic.

4. **Switch workflow mobile**
   - Build full `SwitchWorkflowScreen` with steps 1–5 wired to the backend (or sync queue for offline).

5. **Appointments & follow-ups**
   - Implement appointment and follow-up endpoints on backend.
   - Complete `AppointmentsScreen` and follow-up forms on mobile, integrated with sync engine.

6. **SMS & alerts**
   - Implement SMS templates, schedule endpoint, and Twilio webhook handling.
   - Add `Alert` creation on severe follow-ups and on SMS `HELP` replies.

7. **Dashboard & metrics**
   - Implement dashboard metrics endpoints.
   - Build minimal React dashboard screens for KPIs, recent switches, and alerts.

8. **Localization & UX polish**
   - Ensure EN/ES coverage of all strings, including error states.
   - Polish UX around offline states, sync visibility, and error handling for clinical use.

