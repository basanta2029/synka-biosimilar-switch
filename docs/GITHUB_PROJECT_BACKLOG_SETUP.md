# Synka - GitHub Project Backlog Setup Guide

**Project:** Synka - Biosimilar Switch Kit MVP
**Team:** Howard University Senior Project Team
**Date:** January 2025

---

## Quick Setup Steps

1. Create the **Done** column (scroll right, click "+ New column")
2. Add items to each column as shown below
3. Set the custom fields for each item

---

## Your 5 Columns

| Column | What Goes Here |
|--------|----------------|
| **Backlog** | Future v2 features (you already have 5 items here ✓) |
| **Sprint 6** | Work planned for current sprint (not started yet) |
| **In Progress** | Work someone is actively doing RIGHT NOW |
| **Review** | Finished code waiting for testing |
| **Done** | All completed work from Sprint 1-5 |

---

## STEP 1: Create "Done" Column

1. Scroll right on your board
2. Click **"+ New column"**
3. Type: `Done`
4. Press Enter

---

## STEP 2: Fill the DONE Column (30 items)

These are ALL completed items from Sprint 1-5. Add each one to the **Done** column.

### How to Add Items:
1. Click **"+ Add item"** at bottom of Done column
2. Type the title exactly as shown
3. Press Enter
4. Click on the item to open it
5. Copy the Description into the item body
6. Set the fields (Type, Sprint, Points, Priority)

---

### Sprint 1 - Foundation (6 items)

**Item 1:**
```
Title: [EPIC] Foundation & Setup

Type: Epic
Sprint: Sprint 1
Points: 21
Priority: P0-Critical

Acceptance Criteria:
- [x] Backend server setup complete
- [x] Database schema designed
- [x] Authentication system working
- [x] Mobile app initialized
- [x] Navigation structure complete
```

**Item 2:**
```
Title: [TASK-1.1] Backend Project Setup

Type: Task
Sprint: Sprint 1
Points: 3
Assignee: Cameron

Acceptance Criteria:
- [x] Express.js + TypeScript configured
- [x] Prisma ORM with SQLite
- [x] Project structure organized
- [x] All dependencies installed
```

**Item 3:**
```
Title: [TASK-1.2] Database Schema Design

Type: Task
Sprint: Sprint 1
Points: 5
Assignee: Basanta

Acceptance Criteria:
- [x] 8 database tables created (users, patients, drugs, switches, appointments, follow_ups, sms_logs, alerts)
- [x] Prisma schema complete
- [x] Migrations run successfully
- [x] Indexes on frequently queried fields
```

**Item 4:**
```
Title: [TASK-1.3] JWT Authentication System

Type: Task
Sprint: Sprint 1
Points: 5
Assignee: Basanta

Acceptance Criteria:
- [x] User registration with validation
- [x] Login returns JWT token
- [x] Password hashing with bcrypt
- [x] Token expiration (7 days)
- [x] Protected routes middleware
```

**Item 5:**
```
Title: [TASK-1.4] Mobile App Setup & Navigation

Type: Task
Sprint: Sprint 1
Points: 5
Assignee: Sollomon

Acceptance Criteria:
- [x] React Native 0.82.1 configured
- [x] TypeScript setup
- [x] React Navigation (stack + tabs)
- [x] Auth flow navigation
- [x] Main app navigation structure
```

**Item 6:**
```
Title: [TASK-1.5] Local SQLite Database

Type: Task
Sprint: Sprint 1
Points: 3
Assignee: Sollomon

Acceptance Criteria:
- [x] SQLite initialized on app start
- [x] 8 tables matching server schema
- [x] CRUD operations work offline
- [x] Sync flag tracks sync status
```

---

### Sprint 2 - Patient Management (6 items)

**Item 7:**
```
Title: [EPIC] Patient Management

Type: Epic
Sprint: Sprint 2
Points: 24
Priority: P0-Critical

Acceptance Criteria:
- [x] Patient registration working
- [x] Patient search functional
- [x] Patient detail view complete
- [x] Offline sync queue operational
- [x] All patient APIs implemented
```

**Item 8:**
```
Title: [US-2.1] Patient Registration Form

Type: User Story
Sprint: Sprint 2
Points: 5
Assignee: Destin

Acceptance Criteria:
- [x] Form: name, phone, DOB, language, diagnosis, allergies
- [x] Formik + Yup validation
- [x] Phone number validation
- [x] Age validation (18+)
- [x] Client-generated UUID
- [x] Works offline
```

**Item 9:**
```
Title: [US-2.2] Patient Search

Type: User Story
Sprint: Sprint 2
Points: 3
Assignee: Sollomon

Acceptance Criteria:
- [x] Search bar on patient list
- [x] Search by name or phone
- [x] Works offline (queries local SQLite)
- [x] Debounced 300ms
- [x] Clear button to reset
```

**Item 10:**
```
Title: [US-2.3] Patient Detail View

Type: User Story
Sprint: Sprint 2
Points: 3
Assignee: Destin

Acceptance Criteria:
- [x] Profile card with all info
- [x] Switch history display
- [x] Upcoming appointments
- [x] Edit and delete actions
- [x] Pull-to-refresh
```

**Item 11:**
```
Title: [TASK-2.4] Offline Sync Queue

Type: Task
Sprint: Sprint 2
Points: 8
Assignee: Cameron

Acceptance Criteria:
- [x] Sync queue stores pending operations
- [x] Auto-sync every 30 seconds
- [x] Retry logic (max 3 attempts)
- [x] Visual indicator for unsynced items
- [x] Network status indicator
- [x] Orphaned patient detection
```

**Item 12:**
```
Title: [TASK-2.5] Patient API Endpoints

Type: Task
Sprint: Sprint 2
Points: 5
Assignee: Basanta

Acceptance Criteria:
- [x] GET /patients (search + pagination)
- [x] POST /patients (with validation)
- [x] GET /patients/:id
- [x] PUT /patients/:id
- [x] DELETE /patients/:id
```

---

### Sprint 3 - Switch Workflow (6 items)

**Item 13:**
```
Title: [EPIC] Biosimilar Switch Workflow

Type: Epic
Sprint: Sprint 3
Points: 28
Priority: P0-Critical

Acceptance Criteria:
- [x] Eligibility checking works
- [x] Drug selection with cost comparison
- [x] Multi-step workflow complete
- [x] Consent documentation captured
- [x] All switch APIs implemented
```

**Item 14:**
```
Title: [TASK-3.1] Eligibility Checker Engine

Type: Task
Sprint: Sprint 3
Points: 8
Assignee: Basanta

Acceptance Criteria:
- [x] Check pending switches
- [x] Biosimilar availability check
- [x] Diagnosis-drug compatibility (16 diagnoses)
- [x] Allergy contraindication checking (10+ allergies)
- [x] Interchangeability status
- [x] Cost savings calculation
- [x] Returns reasons and warnings
```

**Item 15:**
```
Title: [US-3.2] Drug Selection with Cost Comparison

Type: User Story
Sprint: Sprint 3
Points: 5
Assignee: Sollomon

Acceptance Criteria:
- [x] Current drug selection
- [x] Filter biosimilars by therapeutic class
- [x] Display: name, cost, savings amount, savings %
- [x] Monthly and annual savings calculation
- [x] FDA Purple Book data integration
```

**Item 16:**
```
Title: [US-3.3] Multi-Step Switch Workflow Screen

Type: User Story
Sprint: Sprint 3
Points: 8
Assignee: Destin

Acceptance Criteria:
- [x] Step 1: SELECT_DRUG
- [x] Step 2: ELIGIBILITY check
- [x] Step 3: SELECT_BIOSIMILAR
- [x] Step 4: CONSENT recording
- [x] Step 5: CONFIRMATION
- [x] Progress indicator
```

**Item 17:**
```
Title: [US-3.4] Consent Documentation

Type: User Story
Sprint: Sprint 3
Points: 3
Assignee: Destin

Acceptance Criteria:
- [x] Consent text in patient's language
- [x] Checkbox confirmation
- [x] Timestamp captured
- [x] Stored in switch record
```

**Item 18:**
```
Title: [TASK-3.5] Switch API Endpoints

Type: Task
Sprint: Sprint 3
Points: 5
Assignee: Basanta

Acceptance Criteria:
- [x] POST /switches (create with appointments)
- [x] GET /switches (filter by status/patient)
- [x] PUT /switches/:id/consent
- [x] PUT /switches/:id/complete
- [x] PUT /switches/:id/cancel
```

---

### Sprint 4 - Appointments (5 items)

**Item 19:**
```
Title: [EPIC] Appointments & Follow-ups

Type: Epic
Sprint: Sprint 4
Points: 18
Priority: P0-Critical

Acceptance Criteria:
- [x] Auto-scheduling works
- [x] Appointments list functional
- [x] Follow-up form complete
- [x] Follow-up API working
```

**Item 20:**
```
Title: [TASK-4.1] Automatic Appointment Scheduling

Type: Task
Sprint: Sprint 4
Points: 5
Assignee: Basanta

Acceptance Criteria:
- [x] Day-3 follow-up auto-scheduled
- [x] Day-14 follow-up auto-scheduled
- [x] Linked to switch record
- [x] Status tracking (SCHEDULED/COMPLETED)
```

**Item 21:**
```
Title: [US-4.2] Appointments List Screen

Type: User Story
Sprint: Sprint 4
Points: 5
Assignee: Sollomon

Acceptance Criteria:
- [x] View upcoming appointments
- [x] Filter by status (Upcoming/All/Completed)
- [x] Appointment cards with patient info
- [x] Pull-to-refresh
```

**Item 22:**
```
Title: [US-4.3] Follow-up Form Modal

Type: User Story
Sprint: Sprint 4
Points: 5
Assignee: Destin

Acceptance Criteria:
- [x] Side effects: yes/no toggle
- [x] Severity: MILD/MODERATE/SEVERE
- [x] Still taking medication toggle
- [x] Patient satisfaction rating
- [x] Notes field
```

**Item 23:**
```
Title: [TASK-4.4] Follow-up Recording API

Type: Task
Sprint: Sprint 4
Points: 3
Assignee: Basanta

Acceptance Criteria:
- [x] Record follow-up endpoint
- [x] Auto-escalation for SEVERE reactions
- [x] Auto-failure if discontinued
- [x] Auto-complete switch on success
```

---

### Sprint 5 - Dashboard & Profile (7 items)

**Item 24:**
```
Title: [EPIC] Dashboard & Analytics

Type: Epic
Sprint: Sprint 5
Points: 13
Priority: P0-Critical

Acceptance Criteria:
- [x] Dashboard metrics API complete
- [x] Dashboard UI functional
- [x] Alerts system working
```

**Item 25:**
```
Title: [TASK-5.1] Dashboard Metrics API

Type: Task
Sprint: Sprint 5
Points: 5
Assignee: Cameron

Acceptance Criteria:
- [x] Total switches count
- [x] Pending/Completed/Failed counts
- [x] Success rate calculation
- [x] Monthly/Annual savings
- [x] Upcoming appointments count
- [x] Unreviewed alerts count
```

**Item 26:**
```
Title: [US-5.2] Dashboard Screen UI

Type: User Story
Sprint: Sprint 5
Points: 5
Assignee: Sollomon

Acceptance Criteria:
- [x] Metrics cards display
- [x] Visual progress bar
- [x] Switch status distribution
- [x] Pull-to-refresh
- [x] Loading states
```

**Item 27:**
```
Title: [TASK-5.3] Alerts System

Type: Task
Sprint: Sprint 5
Points: 3
Assignee: Cameron

Acceptance Criteria:
- [x] Alert creation for SEVERE side effects
- [x] Alert creation for failed switches
- [x] Unreviewed alerts counting
- [x] Alert types: SEVERE_REACTION, FAILED_SWITCH
```

**Item 28:**
```
Title: [EPIC] Profile & Settings

Type: Epic
Sprint: Sprint 5
Points: 8
Priority: P1-High

Acceptance Criteria:
- [x] Profile screen complete
- [x] Sync management working
- [x] Data management functional
```

**Item 29:**
```
Title: [US-6.1] Profile Screen

Type: User Story
Sprint: Sprint 5
Points: 5
Assignee: Destin

Acceptance Criteria:
- [x] User profile display
- [x] Language switcher (EN/ES)
- [x] Sync status indicator
- [x] App version display
- [x] Logout functionality
```

**Item 30:**
```
Title: [US-6.2] Sync Now & Data Management

Type: User Story
Sprint: Sprint 5
Points: 3
Assignee: Cameron

Acceptance Criteria:
- [x] Manual Sync Now button
- [x] Pending queue count display
- [x] Clear All Data functionality
- [x] Database reset with server sync
```

---

## STEP 3: Fill the SPRINT 6 Column (9 items)

These are items planned for the current sprint. Add to **Sprint 6** column.

**Item 31:**
```
Title: [EPIC] SMS Notifications

Type: Epic
Sprint: Sprint 6
Points: 13
Priority: P1-High

Acceptance Criteria:
- [ ] Twilio SDK integrated
- [ ] SMS reminders sent automatically
- [ ] SMS logged in database
```

**Item 32:**
```
Title: [TASK-7.1] Twilio SMS Integration

Type: Task
Sprint: Sprint 6
Points: 8
Assignee: Cameron
Priority: P1-High

Acceptance Criteria:
- [ ] Twilio SDK integrated
- [ ] SMS sending function with error handling
- [ ] SMS logged in sms_logs table
- [ ] Webhook endpoint for delivery status
- [ ] Environment variables for credentials
```

**Item 33:**
```
Title: [US-7.2] Automated SMS Reminders

Type: User Story
Sprint: Sprint 6
Points: 5
Assignee: Basanta
Priority: P1-High

Acceptance Criteria:
- [ ] SMS scheduled when appointment created
- [ ] Sent 24 hours before scheduled time
- [ ] Message in patient's language (EN/ES)
- [ ] Includes appointment time, clinic name, phone
- [ ] Retry logic (max 3 attempts)
```

**Item 34:**
```
Title: [TASK] End-to-End Testing

Type: Task
Sprint: Sprint 6
Points: 8
Assignee: All
Priority: P0-Critical

Acceptance Criteria:
- [ ] Test complete patient workflow
- [ ] Test complete switch workflow
- [ ] Test offline → online sync
- [ ] Test follow-up completion
- [ ] Test dashboard metrics accuracy
- [ ] Test on physical Android device
```

**Item 35:**
```
Title: [TASK] Bug Fixes from Testing

Type: Task
Sprint: Sprint 6
Points: 8
Assignee: All
Priority: P0-Critical

Acceptance Criteria:
- [ ] Fix any bugs found during E2E testing
- [ ] Address edge cases
- [ ] Handle error states gracefully
```

**Item 36:**
```
Title: [TASK] UI Polish & Error Handling

Type: Task
Sprint: Sprint 6
Points: 5
Assignee: Sollomon, Destin
Priority: P1-High

Acceptance Criteria:
- [ ] Consistent loading states
- [ ] User-friendly error messages
- [ ] Empty states for all lists
- [ ] Form validation feedback
- [ ] Accessibility improvements
```

**Item 37:**
```
Title: [TASK] Localization Completion

Type: Task
Sprint: Sprint 6
Points: 3
Assignee: Destin
Priority: P1-High

Acceptance Criteria:
- [ ] All UI strings in translation files
- [ ] Spanish translations complete
- [ ] Date/time formatting by locale
- [ ] Test language switching
```

**Item 38:**
```
Title: [TASK] Documentation

Type: Task
Sprint: Sprint 6
Points: 3
Assignee: Simon
Priority: P1-High

Acceptance Criteria:
- [ ] README with setup instructions
- [ ] API documentation (Postman collection)
- [ ] Architecture document
- [ ] User guide (1-page quick start)
```

**Item 39:**
```
Title: [TASK] Demo Preparation

Type: Task
Sprint: Sprint 6
Points: 5
Assignee: Simon
Priority: P0-Critical

Acceptance Criteria:
- [ ] Demo script with test data
- [ ] Seed database with sample patients
- [ ] Create 2-3 complete switch workflows
- [ ] Record 10-minute demo video
- [ ] Prepare presentation slides
```

---

## STEP 4: Backlog Column (Already Done ✓)

You already have 5 items in Backlog. Just update their Type to **Epic**:

**Item 40:**
```
Title: [EPIC] iOS App Support

Type: Epic
Priority: P3-Low

Acceptance Criteria:
- [ ] Build iOS version of the app
- [ ] Test on iOS devices
- [ ] Submit to App Store
```

**Item 41:**
```
Title: [EPIC] Push Notifications

Type: Epic
Priority: P2-Medium

Acceptance Criteria:
- [ ] FCM integration for Android
- [ ] In-app notification center
- [ ] Notification preferences
```

**Item 42:**
```
Title: [EPIC] Multi-Clinic Support

Type: Epic
Priority: P2-Medium

Acceptance Criteria:
- [ ] Clinic selection in app
- [ ] Clinic-specific data isolation
- [ ] Admin portal for clinic management
```

**Item 43:**
```
Title: [EPIC] Digital Consent Signatures

Type: Epic
Priority: P2-Medium

Acceptance Criteria:
- [ ] Digital signature capture
- [ ] PDF consent generation
- [ ] Document storage
```

**Item 44:**
```
Title: [EPIC] Advanced Reporting & Export

Type: Epic
Priority: P2-Medium

Acceptance Criteria:
- [ ] Export data to CSV/Excel
- [ ] Trend analysis charts
- [ ] Custom date range reports
```

---

## STEP 5: In Progress & Review Columns

**Leave these EMPTY for now.**

When your team starts working:
1. Pick an item from **Sprint 6**
2. Drag it to **In Progress**
3. When code is done, drag to **Review**
4. When tested, drag to **Done**

---

## Final Board Should Look Like:

```
Backlog (5)     Sprint 6 (9)           In Progress (0)   Review (0)   Done (30)
───────────     ─────────────────      ───────────────   ──────────   ─────────
[EPIC] iOS      [EPIC] SMS Notif       (empty)           (empty)      [EPIC] Foundation
[EPIC] Push     [TASK-7.1] Twilio                                     [TASK-1.1]...
[EPIC] Multi    [US-7.2] SMS                                          [EPIC] Patients
[EPIC] Consent  [TASK] E2E Testing                                    [US-2.1]...
[EPIC] Reports  [TASK] Bug Fixes                                      [EPIC] Switches
                [TASK] UI Polish                                      [US-3.2]...
                [TASK] Localization                                   [EPIC] Appointments
                [TASK] Docs                                           [US-4.2]...
                [TASK] Demo Prep                                      [EPIC] Dashboard
                                                                      [TASK-5.1]...
                                                                      [EPIC] Profile
                                                                      [US-6.1]...
```

---

## Summary

| Column | Item Count |
|--------|------------|
| Backlog | 5 |
| Sprint 6 | 9 |
| In Progress | 0 |
| Review | 0 |
| Done | 30 |
| **TOTAL** | **44** |

---

## Quick Reference - Item Types

| Prefix | Type | Example |
|--------|------|---------|
| `[EPIC]` | Epic | Large feature with multiple items |
| `[US-X.X]` | User Story | User-facing feature (screens, forms) |
| `[TASK-X.X]` | Task | Technical work (APIs, database, setup) |
| `[TASK]` | Task | General task without number |

---

**Last Updated:** January 26, 2025
