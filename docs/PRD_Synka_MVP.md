# Synka - Biosimilar Switch Kit MVP
## Product Requirements Document

**Version:** 1.0
**Date:** November 2024
**Timeline:** 12 Weeks
**Platform:** Android (React Native)
**Languages:** English (en-US), Spanish (es-MX)
**Team:** 5 developers (1 Tech Lead, 1 Backend Dev, 2 Frontend Devs, 1 Scrum Lead)

---

## 1. Executive Summary

### 1.1 Product Vision
Synka is a mobile-first healthcare application that enables clinics in emerging markets to safely transition patients from expensive brand-name biologic medications to clinically-equivalent biosimilar alternatives, reducing healthcare costs by 30-70% while maintaining patient safety through structured follow-up protocols.

### 1.2 Business Case
- **Problem:** Biologic drugs cost $2,000-$8,000/month, creating unsustainable healthcare costs
- **Solution:** Biosimilars offer 30-70% savings but require careful patient transition monitoring
- **Market:** Clinics in areas with limited connectivity, low-literacy patients, SMS-first communication
- **Value:** $2,000-5,000 annual savings per patient, improved medication adherence through follow-ups

### 1.3 MVP Scope
This MVP focuses on the **Biosimilar Switch Kit** module only (defers Specialty Access Hub to v2). Core capability: manage the complete lifecycle of one patient biosimilar switch from eligibility check through 14-day follow-up.

---

## 2. Problem Statement

### 2.1 Current State
- Clinics manually track biosimilar switches using paper forms
- No systematic follow-up after medication changes
- Limited visibility into adverse reactions
- Poor medication adherence due to lack of reminders
- Staff cannot access patient data without connectivity
- High no-show rates for follow-up appointments

### 2.2 User Pain Points
| User | Pain Point | Impact |
|------|-----------|---------|
| Clinic Staff | Paper-based tracking leads to lost forms | 15% data loss rate |
| Clinic Staff | Cannot access records offline | 40% of work time is during internet outages |
| Patients | Miss follow-up appointments (no reminders) | 60% no-show rate |
| Doctors | No visibility into switch outcomes | Cannot measure program effectiveness |
| Administrators | Cannot calculate cost savings | Difficulty justifying biosimilar programs |

---

## 3. Goals & Success Metrics

### 3.1 Goals (SMART)
1. **Reduce medication costs** by 40% for participating patients within 12 months
2. **Increase follow-up completion** rate from 40% to 80% through automated reminders
3. **Achieve 95% data sync success** rate in offline-first environments
4. **Support 100 patient switches** during 12-week pilot with zero data loss

### 3.2 Key Performance Indicators (KPIs)
| Metric | Target | Measurement |
|--------|--------|-------------|
| Switch completion rate | >90% | (Completed switches / Initiated switches) × 100 |
| Day-3 follow-up completion | >80% | (Day-3 completed / Day-3 scheduled) × 100 |
| Day-14 follow-up completion | >75% | (Day-14 completed / Day-14 scheduled) × 100 |
| Adverse event detection rate | 100% | All reported events logged within 24hrs |
| Offline operation capability | 7 days | App functions without internet for 1 week |
| SMS delivery success rate | >95% | (Delivered / Sent) × 100 |
| Cost savings per patient/year | >$2,000 | (Brand cost - Biosimilar cost) × 12 months |

### 3.3 Success Criteria for MVP
- [ ] 10+ patients registered
- [ ] 5+ complete switch workflows (initial → day-3 → day-14)
- [ ] App operates offline for 7+ days, syncs successfully
- [ ] SMS sent in correct language (en/es) with >95% delivery
- [ ] Dashboard shows accurate real-time metrics
- [ ] Zero data loss during offline→online transitions
- [ ] Zero crashes during 60-minute stress test

---

## 4. Target Users & Personas

### Persona 1: Maria Rodriguez - Clinic Nurse
**Demographics:**
- Age: 32, Female
- Role: Registered Nurse at community health clinic
- Location: Rural Mexico, intermittent internet (2-4 hours/day)
- Tech: Uses basic Android phone, comfortable with WhatsApp

**Goals:**
- Quickly register patients during busy clinic hours
- Track which patients need follow-up visits
- Send reminders without manually remembering each patient
- Access patient records even when internet is down

**Pain Points:**
- Forgets to follow up with patients after initial switch
- Loses paper forms between clinic and office
- Cannot check patient history when internet is down
- Spends 30+ minutes daily manually sending SMS

**User Needs:**
- Offline-first app that works without internet
- Simple UI with minimal typing
- Automatic reminder scheduling
- Quick search to find patients

---

### Persona 2: Dr. Carlos Mendoza - Physician
**Demographics:**
- Age: 45, Male
- Role: General Physician overseeing biosimilar program
- Location: Urban clinic with reliable internet
- Tech: Uses tablet and desktop computer

**Goals:**
- Monitor patient outcomes after switches
- Identify adverse reactions quickly
- Prove cost savings to hospital administration
- Ensure compliance with switch protocols

**Pain Points:**
- No visibility into follow-up completion rates
- Cannot track which patients had side effects
- Difficult to calculate program ROI
- No alerts when patients report severe reactions

**User Needs:**
- Dashboard with program metrics
- Alerts for severe adverse events
- Cost savings calculator
- Export data for reports

---

### Persona 3: Rosa Hernandez - Patient
**Demographics:**
- Age: 58, Female
- Condition: Rheumatoid arthritis on biologic medication
- Location: Village 15km from clinic, shared phone with family
- Tech: Basic flip phone, rarely uses SMS, low literacy

**Goals:**
- Understand when to take new medication
- Remember follow-up appointment dates
- Report any problems after medication change
- Avoid traveling to clinic unnecessarily

**Pain Points:**
- Forgets appointment dates (no calendar)
- Worried new medication won't work
- Doesn't know who to call if problems arise
- Shares phone with 3 family members

**User Needs:**
- Simple SMS reminders in Spanish
- Clear appointment dates in messages
- Easy way to confirm appointments
- Contact number in every message

---

## 5. User Stories

### Epic 1: Patient Management

**US-1.1:** As a clinic staff, I want to register a new patient so I can track their medication switches.
- **Acceptance Criteria:**
  - Form has fields: Full Name (required, 2-100 chars), Phone (required, 10-15 digits), Date of Birth (required, must be >18 years old), Language (toggle: English/Spanish, default English), Known Allergies (optional, 0-500 chars)
  - Phone number validates format: +[country code][number] or 10-digit local
  - Duplicate phone check: warn if phone exists, allow override
  - Save works offline: queues to sync_queue, shows "Saved locally" message
  - Patient appears in list immediately after save
  - Auto-generates UUID client-side

**US-1.2:** As a clinic staff, I want to search for existing patients by name or phone so I can quickly find their records.
- **Acceptance Criteria:**
  - Search bar at top of patient list
  - Search works offline (searches local SQLite)
  - Searches by: partial name match (case-insensitive), partial phone match
  - Shows results as user types (debounced 300ms)
  - "No results" message if empty
  - Clear button (X) to reset search

**US-1.3:** As a clinic staff, I want to view a patient's switch history so I understand their medication journey.
- **Acceptance Criteria:**
  - Patient detail screen shows: Profile card (name, phone, DOB, language, allergies), Switch history list (date, from drug → to drug, status badge), Upcoming appointments count
  - Each switch is tappable to view details
  - Empty state: "No switches yet" with "Start Switch" button
  - Pull-to-refresh to sync latest data

---

### Epic 2: Biosimilar Switch Workflow

**US-2.1:** As a clinic staff, I want to check if a patient is eligible for biosimilar switch so I ensure safety.
- **Acceptance Criteria:**
  - Eligibility rules (all must be true):
    - Patient age ≥18 years old
    - No history of severe allergic reactions to current drug
    - Patient has been stable on current drug for ≥3 months
    - Current drug is a brand-name biologic (not already biosimilar)
  - If eligible: green checkmark, "Patient eligible" message
  - If not: red X with specific reason ("Patient under 18" / "Severe allergy history" / "Unstable condition" / "Already on biosimilar")
  - Override option for doctor: "Override eligibility" button (requires note)

**US-2.2:** As a clinic staff, I want to select a biosimilar alternative and see cost comparison so I can inform the patient.
- **Acceptance Criteria:**
  - Drug selection screen shows:
    - Current drug card: Name, Type (Brand), Cost/month
    - Available biosimilars list: Name, Cost/month, Savings amount (calculated), Savings % (calculated)
  - Biosimilar list filtered by: approved_for_switch=true, same therapeutic class
  - Sort options: Highest savings (default), Alphabetical
  - Tap biosimilar → shows details modal: Name, Manufacturer, Cost, Approval date, "Select this drug" button
  - Cost savings calculation: `(brand_cost - biosimilar_cost) × 12 months`
  - Example: Brand $3,000/mo, Biosimilar $900/mo → Savings: $2,100/mo, $25,200/year (70%)

**US-2.3:** As a clinic staff, I want to schedule follow-up appointments so the patient is monitored after the switch.
- **Acceptance Criteria:**
  - Three appointments required:
    1. **Initial Switch Day:** Date picker (default: today), Time picker
    2. **Day-3 Follow-up:** Auto-calculated (initial date + 3 days), Time picker (default: 9:00 AM)
    3. **Day-14 Follow-up:** Auto-calculated (initial date + 14 days), Time picker (default: 9:00 AM)
  - Validation: Initial date cannot be in the past, Day-3 must be ≥2 days after initial (allow manual adjust), Day-14 must be ≥13 days after initial
  - Shows calendar view with selected dates highlighted
  - Each appointment shows: Date, Time, Type badge (color-coded)
  - SMS scheduled automatically 24hrs before each appointment

**US-2.4:** As a clinic staff, I want to record patient consent so I document agreement for the switch.
- **Acceptance Criteria:**
  - Consent screen shows:
    - Patient name at top
    - "I agree to switch from [Brand Drug] to [Biosimilar Drug]" text (in patient's language)
    - Checkbox: "Patient verbally confirmed understanding" (required)
    - Checkbox: "Patient signed consent form" (required)
    - Text area: "Additional notes" (optional, 0-1000 chars)
    - Date/time stamp: Auto-filled with current timestamp
  - Cannot proceed unless both checkboxes checked
  - Consent stored in switch_records table: consent_obtained=true, consent_timestamp

**US-2.5:** As a clinic staff, I want to review and submit the complete switch plan so I finalize the process.
- **Acceptance Criteria:**
  - Summary screen shows:
    - Patient: Name, Phone
    - Switch: From [Brand] → To [Biosimilar]
    - Cost Savings: $X/month, $Y/year
    - Appointments: Initial (date/time), Day-3 (date/time), Day-14 (date/time)
    - Consent: ✓ Obtained
  - Buttons: "Back" (edit), "Submit" (primary action)
  - On submit:
    - Show loading spinner
    - Create switch_record in DB
    - Create 3 appointments in DB
    - Queue 3 SMS messages
    - If offline: Add to sync_queue
    - Show success modal: "Switch created! SMS reminders scheduled."
  - Return to patient detail screen showing new switch

---

### Epic 3: Appointment Management

**US-3.1:** As a clinic staff, I want to view today's scheduled appointments so I know who to expect.
- **Acceptance Criteria:**
  - "Today" tab on Appointments screen
  - List shows appointments where scheduled_date = today
  - Each card shows: Patient name, Appointment time, Type badge (Initial/Day-3/Day-14), Status badge
  - Sort by: Time (earliest first)
  - Empty state: "No appointments today" with calendar icon
  - Pull-to-refresh to sync

**US-3.2:** As a clinic staff, I want to mark an appointment as complete so I track attendance.
- **Acceptance Criteria:**
  - Appointment detail screen shows: Patient info card, Appointment info (type, date/time, status), "Mark Complete" button (if status=scheduled), "Add Follow-up Notes" button (if type=day-3 or day-14)
  - Tap "Mark Complete":
    - Show confirmation dialog: "Mark appointment complete?"
    - On confirm: Update status=completed, completed_at=NOW()
    - If type=day-3 or day-14: Automatically open Follow-up Form
  - Completed appointments show green checkmark
  - Cannot mark future appointments complete (button disabled with message)

**US-3.3:** As a clinic staff, I want to reschedule appointments so I accommodate patient conflicts.
- **Acceptance Criteria:**
  - Appointment detail → "Reschedule" button
  - Opens date/time picker with current values pre-filled
  - Validation: New date must be future, Cannot reschedule within 2 hours of appointment
  - On save:
    - Update scheduled_at to new value
    - Update status=rescheduled
    - Cancel previously scheduled SMS
    - Schedule new SMS for 24hrs before new time
    - Update appointment in DB
  - Show confirmation: "Appointment rescheduled. New SMS sent."

---

### Epic 4: Follow-Up Tracking

**US-4.1:** As a clinic staff, I want to record day-3 follow-up results so I track early reactions.
- **Acceptance Criteria:**
  - Follow-up form (day-3 specific):
    - Question 1: "Has patient experienced any side effects?" → Yes/No toggle
    - If Yes → Severity: Mild/Moderate/Severe (required radio buttons)
    - If Yes → Description: Text area (required, 10-1000 chars)
    - Question 2: "Is patient still taking the biosimilar?" → Yes/No toggle
    - If No → Reason: Text area (required)
    - Additional notes: Text area (optional, 0-1000 chars)
  - Validation: Cannot submit if Yes selected but no severity/description
  - On submit:
    - Create follow_up record
    - Update appointment status=completed
    - If severity=severe: Create alert in dashboard, Show warning modal: "Severe reaction reported. Notify doctor immediately."
    - If still_taking=false: Flag switch_record status=failed
  - Show success message, return to appointments list

**US-4.2:** As a clinic staff, I want to record day-14 follow-up results so I track long-term adherence.
- **Acceptance Criteria:**
  - Follow-up form (day-14 specific):
    - Question 1: "Is patient still taking the biosimilar?" → Yes/No toggle
    - If No → Reason dropdown: "Side effects", "Cost", "No improvement", "Forgot", "Other" (required)
    - If No → Additional details: Text area (optional)
    - Question 2: "Has patient experienced any new side effects since day-3?" → Yes/No toggle
    - If Yes → Description: Text area (required)
    - Question 3: "Patient satisfaction" → Scale 1-5 stars (required)
    - Additional notes: Text area (optional)
  - On submit:
    - Create follow_up record
    - Update appointment status=completed
    - Update switch_record status=completed (if still_taking=true) or failed (if false)
    - Calculate completion: If both day-3 and day-14 complete → mark switch fully complete
  - Show success message with celebration: "Switch completed successfully! 🎉"

**US-4.3:** As a doctor, I want to see alerts for severe reactions so I can intervene quickly.
- **Acceptance Criteria:**
  - Dashboard shows "Alerts" section at top
  - Alerts appear when: follow_up.side_effect_severity=severe, follow_up.needs_escalation=true
  - Each alert card shows: Patient name, Phone, Switch date, Follow-up type (Day-3/Day-14), Side effects description, Time reported, "View Details" button, "Mark Reviewed" button
  - Alerts sorted by: Unreviewed first, then by date (newest first)
  - Tap "View Details" → Opens patient detail with follow-up expanded
  - Tap "Mark Reviewed" → Moves to "Reviewed Alerts" section, adds reviewed_by user and timestamp

---

### Epic 5: SMS Reminders

**US-5.1:** As a patient, I want to receive appointment reminders 24hrs before so I don't forget.
- **Acceptance Criteria:**
  - SMS sent automatically 24 hours before appointment scheduled_at time
  - Message format (English):
    ```
    Hi {patient.name}, reminder: You have an appointment tomorrow at {time} for your medication switch at {clinic.name}. Reply CONFIRM or call {clinic.phone}. -Synka
    ```
  - Message format (Spanish):
    ```
    Hola {patient.name}, recordatorio: Tiene una cita mañana a las {time} para su cambio de medicamento en {clinic.name}. Responda CONFIRMAR o llame a {clinic.phone}. -Synka
    ```
  - Variables replaced: {patient.name}, {time} (formatted in patient's language: 2:30 PM / 14:30), {clinic.name}, {clinic.phone}
  - SMS logged in sms_logs table: phone_number, message, language, sent_at, delivery_status=pending
  - Twilio webhook updates delivery_status to: sent/delivered/failed
  - If failed: Retry after 1 hour (max 3 retries)

**US-5.2:** As clinic staff, I want to manually send SMS reminders so I can follow up with specific patients.
- **Acceptance Criteria:**
  - Appointment detail screen → "Send Reminder" button
  - Button disabled if SMS sent in last 4 hours (prevent spam)
  - Tap button → Show confirmation: "Send SMS to {phone}?"
  - On confirm:
    - Call POST /sms/send with appointment_id
    - Show loading spinner
    - On success: Show toast "SMS sent successfully"
    - On failure: Show error "Failed to send SMS: {reason}"
  - SMS log updated with manual send flag
  - Works offline: Queues SMS for send when online

**US-5.3:** As clinic staff, I want to see SMS delivery status so I know if patients received reminders.
- **Acceptance Criteria:**
  - Appointment card shows SMS badge:
    - Gray "Not sent" (no SMS yet)
    - Blue "Sent" (Twilio accepted)
    - Green "Delivered" (patient received)
    - Red "Failed" (delivery failed)
  - Tap badge → Shows SMS history modal: List of all SMS for this appointment, Each showing: Date/time, Status, Message preview, "Resend" button (if failed)
  - Patient detail screen shows "Communication" tab: All SMS sent to patient, Filter by status, Date range picker

---

### Epic 6: Offline Operation & Sync

**US-6.1:** As clinic staff, I want the app to work without internet so I can use it during outages.
- **Acceptance Criteria:**
  - App detects connectivity status using NetInfo
  - Header shows status indicator:
    - Green wifi icon "Online" (connected)
    - Orange cloud icon "Syncing..." (uploading queued data)
    - Gray offline icon "Offline - data will sync later" (no connection)
  - All core functions work offline: Register patients, Create switches, Schedule appointments, Record follow-ups, View existing data (cached locally)
  - Offline actions saved to: Local SQLite database, sync_queue table for pending uploads
  - User sees "Saved locally" confirmation for offline actions
  - Data timestamped with: created_at_device (device time), synced=false flag

**US-6.2:** As clinic staff, I want queued data to sync automatically when internet returns so I don't lose work.
- **Acceptance Criteria:**
  - App polls connectivity every 30 seconds
  - When connection detected:
    - Show "Syncing..." in header
    - Process sync_queue in FIFO order
    - For each queued item:
      1. Make API call (POST/PUT based on action)
      2. If success: Delete from sync_queue, update synced=true in entity table, Log to sync_log
      3. If failure: Increment retry_count, exponential backoff (1s, 2s, 4s, 8s, 16s, max 60s), If retry_count>5: Mark as failed, show in "Sync Errors" screen
  - Progress shown: "Syncing... 3/12 items"
  - On complete: Show success toast "All data synced ✓", Update last_sync_time in local storage
  - If conflicts: Show modal "Some data was updated on server. Reload?" → Fetch fresh data

**US-6.3:** As a developer, I want conflict resolution rules so data stays consistent.
- **Acceptance Criteria:**
  - Conflict detection: Compare updated_at timestamps (server vs local)
  - Resolution strategy: **Server wins** (remote data is source of truth)
  - Conflict handling:
    1. Log conflict to conflicts table: entity_type, entity_id, local_data JSON, server_data JSON, conflict_time
    2. Overwrite local data with server data
    3. Show user notification: "Some data was updated by another user"
    4. Option to view conflict log in Settings → "Data Conflicts"
  - Edge cases:
    - Delete conflict: If entity deleted on server but edited locally → Accept deletion, discard local edits, warn user
    - Create conflict: If same patient created offline by 2 devices (duplicate phone) → Server deduplicates by phone, returns existing ID
  - Manual conflict resolution screen: Shows side-by-side comparison, Admin can choose "Keep Local" or "Keep Server", Decision logged

---

### Epic 7: Dashboard & Reporting

**US-7.1:** As a doctor, I want to see program metrics so I understand switch outcomes.
- **Acceptance Criteria:**
  - Dashboard shows metric cards (refresh on load):
    1. **Total Switches:** Count of switch_records (all statuses)
    2. **Completed Switches:** Count where status=completed, Percentage of total
    3. **Active Switches:** Count where status=pending
    4. **Failed Switches:** Count where status=failed, Tap to see failure reasons
    5. **Total Cost Savings:** Sum of (brand_cost - biosimilar_cost) × months active
    6. **Follow-up Completion Rate:** (Completed follow-ups / Total scheduled) × 100
    7. **Patients with Adverse Events:** Count of follow_ups where has_side_effects=true
  - Each card shows: Large number, Label, Trend indicator (↑/↓ compared to last month), Tap to drill down
  - Date filter: Last 7 days / Last 30 days / Last 90 days / All time
  - Export button: Download CSV of metrics

**US-7.2:** As an admin, I want to see recent switch activity so I monitor daily operations.
- **Acceptance Criteria:**
  - "Recent Switches" table below metrics
  - Columns: Patient Name, From Drug → To Drug, Switch Date, Status (badge), Follow-ups (e.g., "2/3"), Actions (View)
  - Sort by: Switch date (newest first)
  - Pagination: 20 per page
  - Status badges color-coded: Blue "Pending", Green "Completed", Red "Failed", Gray "Cancelled"
  - Tap row → Opens patient detail
  - Empty state: "No switches yet. Start by registering a patient."

**US-7.3:** As a doctor, I want to export switch data so I can create reports for administration.
- **Acceptance Criteria:**
  - Dashboard → "Export" button
  - Opens modal: Select date range (from/to), Select fields: All / Custom checklist (patient demographics, switch details, costs, follow-ups), Format: CSV / Excel
  - Tap "Export":
    - Generate file on server
    - Download to device (Downloads folder)
    - Show success: "Report downloaded: synka_switches_2024-11-03.csv"
  - CSV format: Headers: Patient Name, Patient Phone, From Drug, To Drug, Switch Date, Status, Day-3 Completed, Day-14 Completed, Side Effects, Cost Savings
  - Excel includes: Summary sheet (metrics), Details sheet (all switches), Charts (completion rates over time)

---

## 6. Functional Requirements

### 6.1 Patient Management

**FR-1.1: Patient Registration**
- **Fields:**
  - Full Name: Text input, required, 2-100 characters, letters/spaces/hyphens only, trim whitespace, capitalize each word
  - Phone Number: Text input with numeric keyboard, required, formats: +[1-3 digit country code][10-15 digits] OR 10 digits (auto-add country code), validate using libphonenumber-js, check for duplicates (warn, don't block)
  - Date of Birth: Date picker (calendar modal), required, min age 18 years, max age 120 years, format: YYYY-MM-DD in DB, display format: locale-specific (MM/DD/YYYY for en-US, DD/MM/YYYY for es-MX)
  - Language Preference: Toggle switch (English | Spanish), default: English, stored as enum: 'en' | 'es'
  - Known Allergies: Multi-line text input, optional, 0-500 characters, placeholder: "E.g., Penicillin, shellfish"
- **Validation Rules:**
  - All required fields must have value
  - Phone must be unique in system (soft warning if duplicate)
  - DOB must result in age ≥18
  - Form cannot submit until validation passes
  - Show field-level errors in red below each input
- **Behavior:**
  - Auto-generate UUID on client side (uuid v4)
  - Save to local SQLite immediately
  - Add to sync_queue if offline
  - Show success message: "Patient {name} registered successfully"
  - Clear form and return to patient list

**FR-1.2: Patient Search**
- **Search Criteria:**
  - Searches fields: name (partial, case-insensitive), phone (partial, exact match)
  - Debounced 300ms (don't search every keystroke)
  - Min 2 characters to trigger search
- **Results Display:**
  - Show matching patients in list (max 50 results)
  - Highlight matching text in yellow
  - Sort: Exact matches first, then partial matches, then by name A-Z
  - No results: Show "No patients found for '{query}'" with "Clear Search" button
- **Performance:**
  - Search must complete in <200ms offline (SQLite indexed on name, phone)
  - Show loading skeleton while searching

**FR-1.3: Patient Detail View**
- **Layout Sections:**
  1. **Profile Card:** Name (editable on tap), Phone (tap to call), DOB (age calculated), Language flag icon, Allergies (collapsible if long)
  2. **Stats Row:** Total Switches, Active Switches, Completed Switches
  3. **Switches Tab:** List of all switches for patient, Each shows: Date, From→To drugs, Status badge, Tap to expand: Appointments list, Follow-ups completion, Quick actions: "View Details", "Continue Switch" (if pending)
  4. **Appointments Tab:** Upcoming (future appointments), Past (completed/missed)
  5. **Communication Tab:** SMS history, Call log (future feature)
- **Actions:**
  - Floating Action Button (FAB): "New Switch" (primary action)
  - Edit icon in header → Edit patient info
  - Delete icon (requires confirmation)

---

### 6.2 Biosimilar Switch Workflow

**FR-2.1: Eligibility Check**
- **Automatic Rules:**
  - ✅ Patient age ≥18 years (from DOB)
  - ✅ No allergy to proposed biosimilar (check allergies field for keyword match)
  - ✅ Current drug is brand-name (check drug.type='brand')
  - ✅ Not already on a biosimilar for same condition
- **Manual Checks (staff confirms):**
  - Checkbox: "Patient has been stable on current medication for ≥3 months"
  - Checkbox: "No recent hospitalizations"
  - Checkbox: "Patient understands biosimilar equivalence"
- **Result Display:**
  - All checks pass: Green card "✓ Patient eligible for biosimilar switch", enable "Continue" button
  - Any check fails: Red card with first failed rule, "Override" button (requires doctor role + reason)
- **Override Flow:**
  - Tap "Override" → Shows modal: "Reason for override" text area (required), "Doctor signature" (typed name), Warning: "This override will be logged and audited"
  - Saves to switch_record: eligibility_override=true, override_reason, overridden_by user ID

**FR-2.2: Drug Selection**
- **Current Drug Input:**
  - Autocomplete search field: "Enter current medication name"
  - Searches drugs table where type='brand'
  - Shows dropdown of matches (name, manufacturer)
  - Must select from list (cannot free-text to ensure data quality)
- **Biosimilar Options Display:**
  - Fetches drugs where: type='biosimilar', approved_for_switch=true, therapeutic_class matches current drug
  - Each option card shows: Drug name, Manufacturer, Cost per month (formatted: $X,XXX.XX), Savings: $X,XXX/month ($X,XXX/year), Savings %: XX% less, Approval info: "FDA approved MM/YYYY"
  - Sort by: Highest savings (default), Cost (low to high), Name (A-Z)
- **Cost Calculation Formula:**
  ```
  monthly_savings = current_drug.cost_per_month - biosimilar.cost_per_month
  annual_savings = monthly_savings × 12
  savings_percent = (monthly_savings / current_drug.cost_per_month) × 100
  ```
- **Selection:**
  - Radio button selection (only one biosimilar)
  - Tap drug card → Expands to show: Full description, Side effects profile, Clinical trial data link, "Select This Drug" button
  - Selected drug highlighted with blue border

**FR-2.3: Appointment Scheduling**
- **Three Appointments Required:**
  1. **Initial Switch Appointment:**
     - Date picker: Default = today, Min = today, Max = today + 30 days
     - Time picker: Default = 9:00 AM, format = 12hr or 24hr based on locale
     - Duration: Not captured (assumed 30 min)
     - Location: Dropdown (from clinics table, future feature), Default = user's clinic
  2. **Day-3 Follow-up:**
     - Date: Auto-calculated = initial_date + 3 days (editable ±1 day)
     - Time: Default = 9:00 AM, editable
     - Type: Locked to "day_3"
  3. **Day-14 Follow-up:**
     - Date: Auto-calculated = initial_date + 14 days (editable ±2 days)
     - Time: Default = 9:00 AM, editable
     - Type: Locked to "day_14"
- **Validation:**
  - Initial date ≥ today
  - Day-3 date ≥ initial_date + 2 days (warn if <3 days)
  - Day-14 date ≥ initial_date + 12 days (warn if <14 days)
  - No appointments on same datetime
- **SMS Scheduling:**
  - Each appointment creates SMS job: scheduled_for = appointment.scheduled_at - 24 hours, template = 'appointment_reminder', language = patient.language
  - SMS sent by backend cron job every 15 minutes checking for due SMS

**FR-2.4: Consent Documentation**
- **Consent Text (generated dynamically):**
  ```
  ENGLISH:
  "I, {patient.name}, agree to switch my medication from {current_drug.name} to {biosimilar.name}. I understand that:
  - {biosimilar.name} is a biosimilar medication clinically equivalent to {current_drug.name}
  - My doctor has determined this switch is safe and appropriate for my condition
  - I will be monitored with follow-up appointments on {day3_date} and {day14_date}
  - I should report any side effects immediately to {clinic.phone}
  Date: {today's date}"

  SPANISH:
  "Yo, {patient.name}, acepto cambiar mi medicamento de {current_drug.name} a {biosimilar.name}. Entiendo que:
  - {biosimilar.name} es un medicamento biosimilar clínicamente equivalente a {current_drug.name}
  - Mi médico ha determinado que este cambio es seguro y apropiado para mi condición
  - Seré monitoreado con citas de seguimiento el {day3_date} y {day14_date}
  - Debo informar cualquier efecto secundario inmediatamente a {clinic.phone}
  Fecha: {fecha de hoy}"
  ```
- **Required Actions:**
  - Staff reads consent text to patient (or patient reads if literate)
  - Checkbox 1: "Patient verbally confirmed understanding" (required)
  - Checkbox 2: "Paper consent form signed" (required, staff will scan/file later)
  - Staff signature: Text input (staff member name)
  - Timestamp: Auto-captured (consent_timestamp)
- **Storage:**
  - Saves to switch_records: consent_obtained=true, consent_text (full text for audit), consent_timestamp, consented_by (staff user ID)

**FR-2.5: Switch Summary & Submission**
- **Review Screen (read-only):**
  - Patient Section: Name, phone, DOB, language
  - Switch Details: From {brand.name} ($X,XXX/mo) → To {biosimilar.name} ($X,XXX/mo), Savings: $X,XXX/month, $X,XXX/year (XX% reduction)
  - Appointments: Initial: {date} at {time}, Day-3: {date} at {time}, Day-14: {date} at {time}
  - Consent: ✓ Obtained on {consent_timestamp}
  - SMS Reminders: ✓ Scheduled (3 reminders)
- **Actions:**
  - "Back" button: Return to edit previous steps
  - "Submit Switch" button (primary): Saves all data
- **Submission Logic:**
  1. Validate all data present
  2. Generate UUIDs for: switch_record, 3 appointments, 3 sms_jobs
  3. If online: POST to API batch endpoint /switches/create-with-appointments
  4. If offline: Save to SQLite, add batch to sync_queue as single transaction
  5. Show success modal: "✓ Switch Created", "Patient: {name}", "Reminders scheduled", "Next: Day-3 follow-up on {date}", Button: "Done" (returns to dashboard)
  6. Send in-app notification to patient (future feature)

---

### 6.3 Follow-Up Tracking

**FR-4.1: Day-3 Follow-up Form**
- **Form Fields:**
  1. **Side Effects:** Toggle (Yes/No), Default: No
     - If Yes → Show additional fields:
       - **Severity:** Required, Radio buttons: Mild (green) / Moderate (yellow) / Severe (red)
       - **Description:** Required, Text area, 10-1000 chars, Placeholder: "Describe symptoms: nausea, rash, etc."
       - **Onset:** Dropdown: Day 1 / Day 2 / Day 3
  2. **Still Taking Medication:** Toggle (Yes/No), Default: Yes
     - If No → Show additional fields:
       - **Stopped Date:** Date picker (max = today)
       - **Reason:** Required, Dropdown: "Side effects too severe" / "No improvement" / "Cost concerns" / "Forgot to take" / "Other"
       - **Other Reason:** Text input (if "Other" selected)
  3. **Additional Notes:** Optional, Text area, 0-500 chars
- **Validation:**
  - If has_side_effects=true: severity and description required
  - If still_taking=false: reason required
  - Cannot submit until validation passes
- **Submission:**
  - Creates follow_up record linked to appointment_id
  - Updates appointment.status = 'completed'
  - If severity='severe': Sets follow_up.needs_escalation=true, Creates dashboard alert
  - If still_taking=false: Updates switch_record.status='failed', cancels day-14 appointment
  - Success message: "Day-3 follow-up recorded"

**FR-4.2: Day-14 Follow-up Form**
- **Form Fields:**
  1. **Still Taking Medication:** Toggle (Yes/No), Default: Yes
     - If No → Same sub-fields as Day-3
  2. **New Side Effects Since Day-3:** Toggle (Yes/No), Default: No
     - If Yes → Same severity/description fields as Day-3
  3. **Overall Experience:** Required, Star rating 1-5 stars, Labels: 1="Poor", 2="Fair", 3="Good", 4="Very Good", 5="Excellent"
  4. **Would Recommend to Others:** Toggle (Yes/No/Unsure), Optional
  5. **Additional Comments:** Optional, Text area, 0-1000 chars
- **Completion Logic:**
  - If still_taking=true AND no severe side effects: switch_record.status='completed', completion_date=today
  - If still_taking=false: switch_record.status='failed'
  - Calculate switch duration: completion_date - switch_date (should be ~14 days)
- **Celebration:**
  - If successful: Show animated success screen: "🎉 Switch Completed Successfully!", "Patient has successfully transitioned to {biosimilar.name}", "Cost savings: ${annual_savings}/year", "View Dashboard" button

---

### 6.4 SMS Integration

**FR-5.1: Automated SMS Reminders**
- **Trigger:** Cron job runs every 15 minutes: `SELECT * FROM sms_jobs WHERE scheduled_for <= NOW() AND status='pending'`
- **Message Templates:**
  ```javascript
  const templates = {
    appointment_reminder: {
      en: `Hi {{patient_name}}, reminder: You have an appointment tomorrow at {{time}} for your medication switch at {{clinic_name}}. Reply CONFIRM or call {{clinic_phone}}. -Synka`,
      es: `Hola {{patient_name}}, recordatorio: Tiene una cita mañana a las {{time}} para su cambio de medicamento en {{clinic_name}}. Responda CONFIRMAR o llame a {{clinic_phone}}. -Synka`
    },
    day_3_reminder: {
      en: `Hi {{patient_name}}, it's been 3 days since your medication switch. Please visit {{clinic_name}} or call {{clinic_phone}} for your check-in. -Synka`,
      es: `Hola {{patient_name}}, han pasado 3 días desde su cambio de medicamento. Por favor visite {{clinic_name}} o llame a {{clinic_phone}} para su chequeo. -Synka`
    }
  };
  ```
- **Variable Replacement:**
  - {{patient_name}}: patient.name (first name only if space exists)
  - {{time}}: Format based on language (en: 2:30 PM, es: 14:30)
  - {{clinic_name}}: Default clinic name from config
  - {{clinic_phone}}: Format: (XXX) XXX-XXXX
- **Twilio Integration:**
  ```javascript
  twilio.messages.create({
    to: patient.phone,
    from: TWILIO_PHONE_NUMBER,
    body: rendered_message
  })
  ```
- **Logging:**
  - Before send: Insert sms_logs (status='pending')
  - After send: Update with twilio_sid, sent_at, status='sent'
  - Webhook from Twilio: Update delivery_status ('delivered' / 'failed')
- **Failure Handling:**
  - If Twilio returns error: Log error_message, Set status='failed', Retry logic: Wait 1hr, try again (max 3 retries), After 3 failures: Alert admin

**FR-5.2: Manual SMS Send**
- **Access:** Appointment detail screen → "Send Reminder Now" button
- **Conditions:** Button enabled if: Last SMS >4 hours ago (prevent spam), Patient phone exists
- **Flow:**
  1. User taps button
  2. Show confirmation: "Send SMS to {phone}?" with message preview
  3. On confirm: Call API POST /sms/send {appointment_id, patient_id}
  4. API queues SMS job with priority=high (processes immediately)
  5. Show loading spinner
  6. On success: Toast "SMS sent to {phone}"
  7. On failure: Alert "Failed to send: {reason}" with "Retry" button
- **Offline Handling:**
  - Button shows "Queue SMS" when offline
  - Creates local sms_job record with synced=false
  - Adds to sync_queue
  - Sends when connection restored

---

## 7. Non-Functional Requirements

### 7.1 Performance
- App launch: Cold start <3 seconds, Warm start <1 second
- Screen navigation: <200ms transition
- List rendering: Support 1000+ patients without lag (virtualized lists)
- Search results: <200ms for local search, <1 second for server search
- Sync: Process 100 queued items in <30 seconds
- API response times: GET <500ms, POST <1 second

### 7.2 Reliability
- Offline capability: 7 days without internet
- Data persistence: 100% of offline actions saved
- Sync success rate: >99%
- Zero data loss during sync
- App crash rate: <0.1% of sessions
- SMS delivery: >95% success rate

### 7.3 Security
- Authentication: JWT tokens, 7-day expiration
- Password requirements: Min 8 chars, 1 uppercase, 1 number, 1 special char
- Local data: SQLite encryption using SQLCipher
- API: HTTPS only (TLS 1.2+)
- Data minimization: No PHI stored unnecessarily
- Session timeout: 30 minutes inactivity
- Audit logging: All switch actions logged with user, timestamp

### 7.4 Usability
- Language: Full support English & Spanish (no mixed languages)
- Accessibility: Font scaling support, High contrast mode, Screen reader compatible (future)
- Touch targets: Minimum 44×44 pt (iOS) / 48×48 dp (Android)
- Error messages: Clear, actionable, in user's language
- Loading states: Skeleton screens, progress indicators
- Offline indicator: Always visible in header

### 7.5 Scalability
- Database: Support 10,000+ patients per clinic
- Concurrent users: 50 users simultaneously
- API rate limits: 100 requests/minute per user
- SMS volume: 1,000 SMS/month initially (Twilio trial)

---

## 8. Technical Architecture

### 8.1 Mobile App (React Native)

**Technology Stack:**
- React Native 0.72.6
- TypeScript 5.1+
- React Navigation 6.x (stack, tab, drawer navigators)
- React Query 4.x (server state, caching, sync)
- Zustand 4.x (client state)
- react-native-sqlite-storage (offline database)
- Axios 1.5+ (HTTP client)
- date-fns 2.x (date manipulation)
- react-native-paper 5.x (Material Design components)
- react-native-netinfo (connectivity detection)
- react-native-uuid (client-side ID generation)
- Formik + Yup (form handling & validation)

**Project Structure:**
```
/mobile
├── /src
│   ├── /api           # API client, endpoints
│   ├── /components    # Reusable UI components
│   ├── /screens       # Screen components
│   ├── /navigation    # Navigation config
│   ├── /hooks         # Custom hooks
│   ├── /store         # Zustand stores
│   ├── /database      # SQLite schemas, queries
│   ├── /utils         # Helpers, formatters
│   ├── /types         # TypeScript types
│   ├── /i18n          # Translations (en, es)
│   └── /constants     # Colors, sizes, config
├── /android           # Android native code
├── /ios               # iOS native code (future)
└── package.json
```

**Database Schema (SQLite):**
```sql
-- Patients
CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  language TEXT DEFAULT 'en',
  allergies TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced INTEGER DEFAULT 0
);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_synced ON patients(synced);

-- Drugs (read-only, seeded)
CREATE TABLE drugs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'brand' or 'biosimilar'
  cost_per_month REAL,
  approved_for_switch INTEGER DEFAULT 1,
  therapeutic_class TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Switch Records
CREATE TABLE switch_records (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  from_drug_id TEXT NOT NULL,
  to_drug_id TEXT NOT NULL,
  switch_date TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  eligibility_notes TEXT,
  consent_obtained INTEGER DEFAULT 0,
  consent_timestamp TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced INTEGER DEFAULT 0,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (from_drug_id) REFERENCES drugs(id),
  FOREIGN KEY (to_drug_id) REFERENCES drugs(id)
);

-- Appointments
CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  switch_id TEXT NOT NULL,
  appointment_type TEXT NOT NULL,
  scheduled_at TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  synced INTEGER DEFAULT 0,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (switch_id) REFERENCES switch_records(id)
);

-- Follow Ups
CREATE TABLE follow_ups (
  id TEXT PRIMARY KEY,
  appointment_id TEXT NOT NULL,
  completed_at TEXT,
  has_side_effects INTEGER DEFAULT 0,
  side_effect_severity TEXT,
  side_effect_description TEXT,
  still_taking_medication INTEGER,
  needs_escalation INTEGER DEFAULT 0,
  notes TEXT,
  synced INTEGER DEFAULT 0,
  FOREIGN KEY (appointment_id) REFERENCES appointments(id)
);

-- SMS Logs
CREATE TABLE sms_logs (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  appointment_id TEXT,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  language TEXT,
  sent_at TEXT,
  delivery_status TEXT DEFAULT 'pending',
  twilio_sid TEXT,
  error_message TEXT,
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Sync Queue
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  retry_count INTEGER DEFAULT 0,
  last_error TEXT
);
```

---

### 8.2 Backend API (Node.js + Express)

**Technology Stack:**
- Node.js 18 LTS
- Express 4.18+
- TypeScript 5.1+
- PostgreSQL 15+
- Prisma 5.x (ORM)
- JWT (jsonwebtoken)
- Bcrypt (password hashing)
- Twilio SDK (SMS)
- Node-cron (scheduled jobs)
- Joi (validation)
- Winston (logging)

**Project Structure:**
```
/backend
├── /src
│   ├── /routes        # API routes
│   ├── /controllers   # Request handlers
│   ├── /services      # Business logic
│   ├── /middleware    # Auth, validation, error handling
│   ├── /models        # Prisma models (auto-generated)
│   ├── /utils         # Helpers
│   ├── /jobs          # Cron jobs (SMS sending)
│   └── /config        # Environment config
├── /prisma
│   ├── schema.prisma  # Database schema
│   └── /migrations    # DB migrations
├── .env
└── package.json
```

**Database Schema (PostgreSQL):**
```prisma
// prisma/schema.prisma

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // bcrypt hashed
  name      String
  role      Role     @default(STAFF)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  ADMIN
  DOCTOR
  STAFF
}

model Patient {
  id            String         @id @default(uuid())
  name          String
  phone         String         @unique
  dateOfBirth   DateTime
  language      Language       @default(EN)
  allergies     String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  switches      SwitchRecord[]
  appointments  Appointment[]
  smsLogs       SmsLog[]
}

enum Language {
  EN
  ES
}

model Drug {
  id                  String   @id @default(uuid())
  name                String
  type                DrugType
  costPerMonth        Decimal
  approvedForSwitch   Boolean  @default(true)
  therapeuticClass    String
  createdAt           DateTime @default(now())
  switchesFrom        SwitchRecord[] @relation("FromDrug")
  switchesTo          SwitchRecord[] @relation("ToDrug")
}

enum DrugType {
  BRAND
  BIOSIMILAR
}

model SwitchRecord {
  id                String        @id @default(uuid())
  patientId         String
  patient           Patient       @relation(fields: [patientId], references: [id])
  fromDrugId        String
  fromDrug          Drug          @relation("FromDrug", fields: [fromDrugId], references: [id])
  toDrugId          String
  toDrug            Drug          @relation("ToDrug", fields: [toDrugId], references: [id])
  switchDate        DateTime
  status            SwitchStatus  @default(PENDING)
  eligibilityNotes  String?
  consentObtained   Boolean       @default(false)
  consentTimestamp  DateTime?
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  appointments      Appointment[]
}

enum SwitchStatus {
  PENDING
  COMPLETED
  FAILED
  CANCELLED
}

model Appointment {
  id              String            @id @default(uuid())
  patientId       String
  patient         Patient           @relation(fields: [patientId], references: [id])
  switchId        String
  switch          SwitchRecord      @relation(fields: [switchId], references: [id])
  appointmentType AppointmentType
  scheduledAt     DateTime
  status          AppointmentStatus @default(SCHEDULED)
  notes           String?
  createdAt       DateTime          @default(now())
  followUp        FollowUp?
  smsLogs         SmsLog[]
}

enum AppointmentType {
  INITIAL
  DAY_3
  DAY_14
}

enum AppointmentStatus {
  SCHEDULED
  COMPLETED
  MISSED
  RESCHEDULED
}

model FollowUp {
  id                      String    @id @default(uuid())
  appointmentId           String    @unique
  appointment             Appointment @relation(fields: [appointmentId], references: [id])
  completedAt             DateTime?
  hasSideEffects          Boolean   @default(false)
  sideEffectSeverity      Severity?
  sideEffectDescription   String?
  stillTakingMedication   Boolean
  needsEscalation         Boolean   @default(false)
  notes                   String?
}

enum Severity {
  MILD
  MODERATE
  SEVERE
}

model SmsLog {
  id              String         @id @default(uuid())
  patientId       String
  patient         Patient        @relation(fields: [patientId], references: [id])
  appointmentId   String?
  appointment     Appointment?   @relation(fields: [appointmentId], references: [id])
  phoneNumber     String
  message         String
  language        Language
  sentAt          DateTime?
  deliveryStatus  SmsStatus      @default(PENDING)
  twilioSid       String?
  errorMessage    String?
}

enum SmsStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
}
```

**API Endpoints Specification:**

```typescript
// Authentication
POST   /api/v1/auth/register
  Body: { email: string, password: string, name: string, role: 'ADMIN'|'DOCTOR'|'STAFF' }
  Response: { user: { id, email, name, role }, token: string }

POST   /api/v1/auth/login
  Body: { email: string, password: string }
  Response: { user: { id, email, name, role }, token: string }

// Patients
GET    /api/v1/patients?search=&limit=20&offset=0
  Headers: Authorization: Bearer {token}
  Response: { patients: Patient[], total: number }

POST   /api/v1/patients
  Body: { name: string, phone: string, dateOfBirth: string, language: 'EN'|'ES', allergies?: string }
  Response: { patient: Patient }

GET    /api/v1/patients/:id
  Response: { patient: Patient, switches: SwitchRecord[], upcomingAppointments: Appointment[] }

PUT    /api/v1/patients/:id
  Body: { name?, phone?, dateOfBirth?, language?, allergies? }
  Response: { patient: Patient }

DELETE /api/v1/patients/:id
  Response: { success: true }

// Drugs
GET    /api/v1/drugs?type=BRAND|BIOSIMILAR
  Response: { drugs: Drug[] }

GET    /api/v1/drugs/:id
  Response: { drug: Drug }

// Switches
POST   /api/v1/switches
  Body: {
    patientId: string,
    fromDrugId: string,
    toDrugId: string,
    switchDate: string,
    eligibilityNotes?: string,
    consentObtained: boolean,
    consentTimestamp?: string,
    appointments: [
      { appointmentType: 'INITIAL', scheduledAt: string },
      { appointmentType: 'DAY_3', scheduledAt: string },
      { appointmentType: 'DAY_14', scheduledAt: string }
    ]
  }
  Response: { switch: SwitchRecord, appointments: Appointment[], smsJobs: SmsJob[] }

GET    /api/v1/switches?patientId=&status=
  Response: { switches: SwitchRecord[] }

GET    /api/v1/switches/:id
  Response: { switch: SwitchRecord, appointments: Appointment[], followUps: FollowUp[] }

PUT    /api/v1/switches/:id
  Body: { status: 'PENDING'|'COMPLETED'|'FAILED'|'CANCELLED' }
  Response: { switch: SwitchRecord }

// Appointments
GET    /api/v1/appointments?date=YYYY-MM-DD&status=&patientId=
  Response: { appointments: Appointment[] }

POST   /api/v1/appointments
  Body: { patientId: string, switchId: string, appointmentType: string, scheduledAt: string }
  Response: { appointment: Appointment }

PUT    /api/v1/appointments/:id
  Body: { scheduledAt?, status?, notes? }
  Response: { appointment: Appointment }

// Follow-ups
POST   /api/v1/follow-ups
  Body: {
    appointmentId: string,
    hasSideEffects: boolean,
    sideEffectSeverity?: 'MILD'|'MODERATE'|'SEVERE',
    sideEffectDescription?: string,
    stillTakingMedication: boolean,
    notes?: string
  }
  Response: { followUp: FollowUp, appointment: Appointment (updated status) }

GET    /api/v1/follow-ups?appointmentId=
  Response: { followUp: FollowUp }

// SMS
POST   /api/v1/sms/send
  Body: { patientId: string, appointmentId?: string, message: string, language: 'EN'|'ES' }
  Response: { smsLog: SmsLog }

POST   /api/v1/sms/webhook (Twilio callback)
  Body: { MessageSid: string, MessageStatus: string, ErrorCode?: string }
  Response: { success: true }

// Sync
POST   /api/v1/sync
  Body: {
    entities: [
      { type: 'patient', id: string, action: 'create'|'update', data: {...} },
      { type: 'switch', id: string, action: 'create', data: {...} }
    ]
  }
  Response: {
    synced: [{ type, id, status: 'success' }],
    conflicts: [{ type, id, serverData: {...}, localData: {...} }],
    errors: [{ type, id, error: string }]
  }

// Dashboard
GET    /api/v1/dashboard/metrics?startDate=&endDate=
  Response: {
    totalSwitches: number,
    completedSwitches: number,
    activeSwitches: number,
    failedSwitches: number,
    totalCostSavings: number,
    followUpCompletionRate: number,
    adverseEventCount: number
  }

GET    /api/v1/dashboard/recent-switches?limit=20&offset=0
  Response: { switches: SwitchRecord[], total: number }

GET    /api/v1/dashboard/alerts
  Response: { alerts: Alert[] }
```

---

## 9. Success Metrics & KPIs

### 9.1 Technical Metrics (12-week MVP)
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| App crashes | <1% sessions | Firebase Crashlytics |
| API uptime | >99% | StatusCake monitoring |
| API response time (p95) | <1 second | APM tool |
| Offline sync success | >99% | Log analysis |
| SMS delivery rate | >95% | Twilio dashboard |
| Data sync conflicts | <5% of syncs | Conflict log count |

### 9.2 Product Metrics (Pilot Phase)
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Patients registered | >50 | DB count |
| Switches initiated | >10 | DB count |
| Switches completed (initial → day-14) | >5 | DB count where status=COMPLETED |
| Day-3 follow-up completion | >80% | (Completed / Scheduled) × 100 |
| Day-14 follow-up completion | >75% | (Completed / Scheduled) × 100 |
| Adverse events detected | 100% logged | Follow-up records |
| Cost savings per patient | >$2,000/year | (Brand cost - Biosimilar cost) × 12 |

### 9.3 User Experience Metrics
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Time to register patient | <2 minutes | User testing |
| Time to complete switch workflow | <10 minutes | User testing |
| User errors per workflow | <2 | Error logging |
| Staff satisfaction score | >4/5 | Post-pilot survey |
| Patient no-show rate | <20% | Appointment status analysis |

---

## 10. Localization (English & Spanish)

### 10.1 Translation Strategy
- All user-facing strings stored in `/src/i18n/locales/`
- JSON format: `{ "key": "English text", "key_es": "Texto en español" }`
- React Native i18n library: react-i18next
- Language toggle in Settings (persists to local storage)
- SMS templates language-specific

### 10.2 Date & Time Formatting
| Element | English (en-US) | Spanish (es-MX) |
|---------|----------------|----------------|
| Date | MM/DD/YYYY | DD/MM/YYYY |
| Time | 12-hour (2:30 PM) | 24-hour (14:30) |
| Currency | $1,234.56 | $1,234.56 (MXN) |
| Phone | (555) 123-4567 | 55 1234 5678 |

### 10.3 Critical Translation Keys
```json
{
  "welcome": {
    "en": "Welcome to Synka",
    "es": "Bienvenido a Synka"
  },
  "patient_registered": {
    "en": "Patient registered successfully",
    "es": "Paciente registrado exitosamente"
  },
  "error_required_field": {
    "en": "This field is required",
    "es": "Este campo es obligatorio"
  },
  "switch_completed": {
    "en": "Switch completed successfully!",
    "es": "¡Cambio completado exitosamente!"
  }
}
```

---

## 11. Testing Strategy

### 11.1 Unit Tests
- Test coverage target: >70% for business logic
- Framework: Jest + React Native Testing Library
- Test files: Co-located with source files (*.test.ts)
- Focus areas: Validation functions, Date calculations, Cost calculations, Eligibility rules

### 11.2 Integration Tests
- API endpoint tests: Supertest
- Database operations: Test database (PostgreSQL)
- SMS sending: Mock Twilio client
- Auth flows: JWT generation/validation

### 11.3 End-to-End Tests
- Framework: Detox (React Native E2E)
- Critical paths:
  1. Register patient → Create switch → Schedule appointments
  2. Complete day-3 follow-up
  3. Offline registration → Sync when online
  4. SMS reminder flow

### 11.4 Manual Test Cases
| Test Case | Steps | Expected Result |
|-----------|-------|----------------|
| TC-1: Offline patient registration | 1. Disable device internet, 2. Register new patient, 3. Enable internet | Patient syncs to server, no duplicates |
| TC-2: SMS delivery | 1. Create appointment 25 hours in future, 2. Wait for SMS send time | SMS delivered 24hrs before appointment |
| TC-3: Severe reaction escalation | 1. Record day-3 follow-up with severe side effects | Dashboard alert created, flagged for doctor |
| TC-4: Cost calculation accuracy | 1. Select brand ($3,000/mo) and biosimilar ($900/mo) | Displays $2,100/mo, $25,200/yr savings (70%) |

---

## 12. Implementation Roadmap (12 Weeks)

### Week 1-2: Foundation
**Backend:**
- [ ] Project setup (Node + Express + TypeScript)
- [ ] PostgreSQL + Prisma setup
- [ ] User authentication (JWT)
- [ ] Database migrations
- [ ] Basic CRUD endpoints (users, drugs)
- [ ] Seed drug database

**Mobile:**
- [ ] React Native project init
- [ ] Navigation setup (stack, tabs)
- [ ] SQLite setup + schema
- [ ] Auth screens (login, register)
- [ ] Basic UI components library
- [ ] Offline detection logic

### Week 3-4: Patients & Drugs
**Backend:**
- [ ] Patients CRUD endpoints
- [ ] Drugs API (list, filter)
- [ ] Search endpoint
- [ ] Validation middleware

**Mobile:**
- [ ] Patient list screen
- [ ] Patient registration form
- [ ] Patient search
- [ ] Patient detail screen
- [ ] Offline patient storage
- [ ] Sync queue implementation

### Week 5-6: Switch Workflow & Appointments
**Backend:**
- [ ] Switches CRUD endpoints
- [ ] Appointments CRUD endpoints
- [ ] Batch create endpoint (switch + appointments)
- [ ] Cost calculation logic
- [ ] SMS queue table

**Mobile:**
- [ ] Switch workflow screens (5 steps)
- [ ] Drug selection with cost comparison
- [ ] Eligibility checker
- [ ] Appointment scheduling (3 appointments)
- [ ] Consent form
- [ ] Switch summary & submission

### Week 7-8: Follow-Ups & SMS
**Backend:**
- [ ] Follow-ups CRUD endpoints
- [ ] Twilio integration
- [ ] SMS templates
- [ ] Cron job for SMS sending (every 15 min)
- [ ] Twilio webhook handler (delivery status)
- [ ] Alert creation for severe reactions

**Mobile:**
- [ ] Appointments list (today, upcoming)
- [ ] Appointment detail
- [ ] Day-3 follow-up form
- [ ] Day-14 follow-up form
- [ ] Manual SMS send
- [ ] SMS delivery status UI

### Week 9-10: Offline Sync & Dashboard
**Backend:**
- [ ] Sync endpoint (batch processing)
- [ ] Conflict detection logic
- [ ] Dashboard metrics endpoint
- [ ] Recent switches endpoint
- [ ] Alerts endpoint

**Mobile:**
- [ ] Sync logic (queue processing)
- [ ] Conflict resolution UI
- [ ] Retry mechanism with exponential backoff
- [ ] Sync status indicator
- [ ] Dashboard screen (metrics cards)
- [ ] Recent activity list

**Web Dashboard:**
- [ ] React app setup
- [ ] Dashboard metrics display
- [ ] Recent switches table
- [ ] Alerts section
- [ ] Basic charts (optional)

### Week 11-12: Testing, Polish & Demo
- [ ] Bug fixes from testing
- [ ] UI polish (loading states, error messages)
- [ ] Localization complete (all strings)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Documentation (README, API docs)
- [ ] Demo environment setup
- [ ] Demo video recording (10 min)
- [ ] Presentation slides

---

## 13. Dependencies & Third-Party Services

### 13.1 Required Services
| Service | Purpose | Cost | Account Setup |
|---------|---------|------|---------------|
| Twilio | SMS sending | Free trial (500 SMS) → $0.0075/SMS after | https://twilio.com/try-twilio |
| Railway / Render | Backend hosting | Free tier (500 hrs/mo) | https://railway.app or https://render.com |
| PostgreSQL | Database | Free tier (Railway/Render) | Included with hosting |

### 13.2 Development Tools
- Git & GitHub (version control)
- VS Code (IDE)
- Android Studio (Android emulator)
- Postman (API testing)
- DB Browser for SQLite (local DB inspection)

### 13.3 Team Dependencies
- Access to Android device or emulator (all devs)
- Twilio account credentials (shared securely)
- GitHub repository access (all devs)
- Backend API URL (shared after deployment)

---

## 14. Risks & Mitigation Strategies

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Twilio costs exceed budget** | Medium | Medium | Use trial credits (500 SMS free), limit pilot to 20 patients, implement SMS rate limiting |
| **Sync conflicts cause data loss** | Medium | High | Server-wins strategy by default, log all conflicts, implement manual resolution UI |
| **Offline storage fills device** | Low | Medium | Limit local storage to 1000 patients, implement auto-cleanup of old records (>90 days) |
| **Team lacks React Native experience** | Medium | High | Use Expo if needed, pair programming, code reviews, online tutorials |
| **12 weeks insufficient for full scope** | High | High | Prioritize core switch flow, defer day-14 follow-ups if needed, cut nice-to-haves (charts, exports) |
| **SMS delivery failures** | Medium | Medium | Implement retry logic (3 attempts), log all failures, provide manual SMS option |
| **Database schema changes mid-project** | Medium | Medium | Use Prisma migrations, version DB schema, test migrations thoroughly |
| **Backend downtime during demo** | Low | High | Deploy 1 week before demo, load test, have local backup demo data |

---

## 15. Out of Scope (Deferred to v2)

The following features are **NOT included in this MVP** and will be considered for future versions:

❌ **iOS app** (MVP is Android-only)
❌ **IVR (voice call) reminders** (SMS only in MVP)
❌ **WhatsApp integration** (SMS only in MVP)
❌ **USSD support** (for feature phones)
❌ **Multi-language audio prompts** (text-only localization in MVP)
❌ **QR code paper forms** (digital-only in MVP)
❌ **Kiosk mode** (standard app mode only)
❌ **CHW route optimization** (manual scheduling)
❌ **Specialty Access Hub module** (Biosimilar Switch Kit only)
❌ **Advanced encryption** (HTTPS + JWT auth sufficient for MVP)
❌ **Telemedicine integration** (standalone app)
❌ **Photo/lab result uploads** (text-only forms)
❌ **Patient-facing app** (clinic staff app only)
❌ **Multi-clinic support** (single clinic assumed)
❌ **Role-based permissions** (basic auth, all staff have same access)
❌ **Data export to Excel** (dashboard view only)
❌ **Push notifications** (SMS reminders only)
❌ **Biometric authentication** (password-only)
❌ **Offline maps for CHW routes**
❌ **EHR integration** (standalone system)

---

## 16. Acceptance Criteria & Definition of Done

### 16.1 Feature-Level Acceptance
A feature is considered **DONE** when:
- [ ] Code implemented and pushed to GitHub
- [ ] Unit tests written (>70% coverage for business logic)
- [ ] Code reviewed by Tech Lead
- [ ] Works offline (if applicable)
- [ ] Works in both English and Spanish
- [ ] No console errors or warnings
- [ ] Tested on physical Android device
- [ ] Documentation updated (if needed)

### 16.2 MVP Acceptance Criteria
The MVP is considered **COMPLETE** and ready for demo when:

**Functional Requirements:**
- [ ] Clinic staff can register 10+ patients
- [ ] Can create 5+ complete biosimilar switches
- [ ] All 3 appointment types can be scheduled
- [ ] SMS reminders sent automatically 24hrs before appointments
- [ ] Day-3 and day-14 follow-ups can be recorded
- [ ] Severe reactions trigger dashboard alerts
- [ ] Dashboard shows accurate metrics (total switches, completion rate, cost savings)
- [ ] App works offline for 7+ days
- [ ] Offline data syncs successfully when online
- [ ] All features available in English and Spanish

**Technical Requirements:**
- [ ] Android APK builds successfully
- [ ] App installs on Android 8.0+ devices
- [ ] Backend API deployed and accessible
- [ ] Database migrations run successfully
- [ ] Twilio SMS integration working
- [ ] Zero crashes during 60-minute stress test
- [ ] API response times <1 second (95th percentile)

**Documentation:**
- [ ] README with setup instructions
- [ ] API documentation (Postman collection or Swagger)
- [ ] User guide (1-page quick start)
- [ ] Demo script with test data

**Demo Deliverables:**
- [ ] 10-minute demo video showing:
  - Patient registration
  - Complete switch workflow (initial → day-3 → day-14)
  - Offline operation + sync
  - SMS reminders
  - Dashboard metrics
- [ ] Presentation slides (10-15 slides)
- [ ] GitHub repository with clean commit history

### 16.3 Pilot Success Criteria (Post-MVP)
If deployed to pilot clinics, success is measured by:
- [ ] >50 patients registered
- [ ] >10 switches initiated
- [ ] >80% day-3 follow-up completion rate
- [ ] >75% day-14 follow-up completion rate
- [ ] >$20,000 total cost savings (10 patients × $2,000/year)
- [ ] <5% sync failures
- [ ] >95% SMS delivery rate
- [ ] >4/5 staff satisfaction score
- [ ] Zero data loss incidents

---

## 17. Appendices

### Appendix A: Sample Data

**Sample Patients:**
1. Maria Rodriguez, +52 55 1234 5678, Spanish, Rheumatoid Arthritis
2. Juan Hernandez, +52 33 9876 5432, Spanish, Crohn's Disease
3. Sofia Garcia, +1 555 123 4567, English, Psoriasis

**Sample Drugs:**
| Name | Type | Cost/Month | Therapeutic Class |
|------|------|-----------|------------------|
| Humira | Brand | $6,000 | Anti-TNF |
| Amjevita | Biosimilar | $1,800 | Anti-TNF |
| Remicade | Brand | $4,500 | Anti-TNF |
| Inflectra | Biosimilar | $1,500 | Anti-TNF |

**Savings Calculation Example:**
- Patient on Humira ($6,000/mo)
- Switch to Amjevita ($1,800/mo)
- Monthly savings: $4,200
- Annual savings: $50,400
- Savings percentage: 70%

---

**END OF PRODUCT REQUIREMENTS DOCUMENT**

---

**Document Revision History:**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-11-03 | Claude | Initial comprehensive PRD |

**Approval Signatures:**
- Product Owner: ___________________ Date: ___________
- Technical Lead: ___________________ Date: ___________
- Team: ___________________ Date: ___________