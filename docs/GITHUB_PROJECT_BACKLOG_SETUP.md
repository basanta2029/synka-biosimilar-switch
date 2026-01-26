# Synka - GitHub Project Backlog Setup Guide

**Project:** Synka - Biosimilar Switch Kit MVP
**Team:** Howard University Senior Project Team
**Date:** January 2025

---

## Table of Contents

1. [Overview](#1-overview)
2. [Create GitHub Project Board](#2-create-github-project-board)
3. [Add Custom Fields](#3-add-custom-fields)
4. [Create Columns](#4-create-columns)
5. [Add Backlog Items](#5-add-backlog-items)
6. [Set Up Milestones](#6-set-up-milestones)
7. [Create Labels](#7-create-labels)
8. [Project Summary](#8-project-summary)

---

## 1. Overview

This guide provides step-by-step instructions for setting up a GitHub Project board to track the Synka MVP product backlog. The board will display all completed work, current sprint items, and future features.

**Repository:** https://github.com/basanta2029/synka-biosimilar-switch

### Project Status Summary

| Metric | Value |
|--------|-------|
| Total Epics | 7 |
| Total User Stories | 25 |
| Completed Stories | 23 (92%) |
| Remaining Stories | 2 (SMS features) |
| Total Story Points | ~120 |
| Completed Points | ~107 |

---

## 2. Create GitHub Project Board

### Steps:

1. Go to: https://github.com/basanta2029/synka-biosimilar-switch
2. Click the **"Projects"** tab
3. Click **"New Project"**
4. Select **"Start from scratch"** → **"Board"**
5. Name it: `Synka MVP Backlog`
6. Click **"Create project"**

> **Note:** Don't use "Team planning" template - it's complex and slow to load. The simple "Board" option is better for class projects.

---

## 3. Add Custom Fields

In your Project Board, click the **"+"** button next to column headers → **"+ New field"**

### Create these fields:

| Field Name | Field Type | Options to Add |
|------------|-----------|----------------|
| `Priority` | Single select | `P0-Critical`, `P1-High`, `P2-Medium`, `P3-Low` |
| `Sprint` | Single select | `Sprint 1`, `Sprint 2`, `Sprint 3`, `Sprint 4`, `Sprint 5`, `Sprint 6` |
| `Points` | Single select | `1`, `2`, `3`, `5`, `8`, `13` |
| `Type` | Single select | `Epic`, `User Story`, `Task`, `Bug` |
| `Assignee` | Single select | `Basanta`, `Cameron`, `Sollomon`, `Destin`, `Simon` |

### How to Add a Field:

1. Click **"+"** next to any column header
2. Click **"+ New field"**
3. Enter field name (e.g., "Priority")
4. Select field type: **"Single select"**
5. Add options one by one
6. Click **"Save"**

---

## 4. Create Columns

Delete the default columns and create these:

| Column | Purpose |
|--------|---------|
| `Backlog` | Future work not yet planned |
| `Sprint 6 (Current)` | Current sprint items |
| `In Progress` | Actively being worked on |
| `Review` | Ready for testing/review |
| `Done` | Completed work |

### How to Create Columns:

1. Click **"+ New column"** on the right side
2. Enter column name
3. Press Enter
4. Drag columns to reorder (Backlog → Sprint 6 → In Progress → Review → Done)

---

## 5. Add Backlog Items

Click **"+ Add item"** at the bottom of any column, type the title, and press Enter.

After adding each item:
1. Click on the item to open it
2. Fill in the custom fields (Priority, Sprint, Points, Type, Assignee)
3. Add the description in the item's body

---

### DONE COLUMN - Completed Items

Add these items and drag to the **Done** column:

---

#### Epic: Foundation & Setup (Sprint 1)

**Item 1:**
```
Title: [EPIC] Foundation & Setup

Description:
Type: Epic
Sprint: Sprint 1
Points: 21
Priority: P0-Critical
Status: COMPLETE

Includes: Project setup, database schema, authentication, navigation
```

**Item 2:**
```
Title: [TASK-1.1] Backend Project Setup

Description:
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

Description:
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

Description:
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

Description:
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

Description:
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

#### Epic: Patient Management (Sprint 2)

**Item 7:**
```
Title: [EPIC] Patient Management

Description:
Type: Epic
Sprint: Sprint 2
Points: 24
Priority: P0-Critical
Status: COMPLETE

Full patient CRUD with offline-first architecture
```

**Item 8:**
```
Title: [US-2.1] Patient Registration Form

Description:
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

Description:
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

Description:
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

Description:
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

Description:
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

#### Epic: Biosimilar Switch Workflow (Sprint 3)

**Item 13:**
```
Title: [EPIC] Biosimilar Switch Workflow

Description:
Type: Epic
Sprint: Sprint 3
Points: 28
Priority: P0-Critical
Status: COMPLETE

End-to-end switch workflow with eligibility engine
```

**Item 14:**
```
Title: [TASK-3.1] Eligibility Checker Engine

Description:
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

Description:
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

Description:
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

Description:
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

Description:
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

#### Epic: Appointments & Follow-ups (Sprint 4)

**Item 19:**
```
Title: [EPIC] Appointments & Follow-ups

Description:
Type: Epic
Sprint: Sprint 4
Points: 18
Priority: P0-Critical
Status: COMPLETE

Appointment tracking and follow-up data collection
```

**Item 20:**
```
Title: [TASK-4.1] Automatic Appointment Scheduling

Description:
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

Description:
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

Description:
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

Description:
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

#### Epic: Dashboard & Analytics (Sprint 5)

**Item 24:**
```
Title: [EPIC] Dashboard & Analytics

Description:
Type: Epic
Sprint: Sprint 5
Points: 13
Priority: P0-Critical
Status: COMPLETE

Program metrics and visual analytics
```

**Item 25:**
```
Title: [TASK-5.1] Dashboard Metrics API

Description:
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

Description:
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

Description:
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

---

#### Epic: Profile & Settings (Sprint 5)

**Item 28:**
```
Title: [EPIC] Profile & Settings

Description:
Type: Epic
Sprint: Sprint 5
Points: 8
Priority: P1-High
Status: COMPLETE

User profile and app settings
```

**Item 29:**
```
Title: [US-6.1] Profile Screen

Description:
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

Description:
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

### SPRINT 6 (CURRENT) COLUMN - Remaining Items

Add these items and place in the **Sprint 6 (Current)** column:

---

**Item 31:**
```
Title: [EPIC] SMS Notifications

Description:
Type: Epic
Sprint: Sprint 6
Points: 13
Priority: P1-High
Status: IN PROGRESS

SMS reminders for appointments (schema exists, needs implementation)
```

**Item 32:**
```
Title: [TASK-7.1] Twilio SMS Integration

Description:
Type: Task
Sprint: Sprint 6
Points: 8
Assignee: Cameron
Priority: P1-High

Integrate Twilio SDK for SMS sending capability.

Acceptance Criteria:
- [ ] Twilio SDK integrated
- [ ] SMS sending function with error handling
- [ ] SMS logged in sms_logs table
- [ ] Webhook endpoint for delivery status
- [ ] Environment variables for credentials

Note: Database schema already exists, needs service implementation
```

**Item 33:**
```
Title: [US-7.2] Automated SMS Reminders

Description:
Type: User Story
Sprint: Sprint 6
Points: 5
Assignee: Basanta
Priority: P1-High

As a patient, I want reminders 24 hours before appointments.

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

Description:
Type: Task
Sprint: Sprint 6
Points: 8
Assignee: All
Priority: P0-Critical

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

Description:
Type: Task
Sprint: Sprint 6
Points: 8
Assignee: All
Priority: P0-Critical

- [ ] Fix any bugs found during E2E testing
- [ ] Address edge cases
- [ ] Handle error states gracefully
```

**Item 36:**
```
Title: [TASK] UI Polish & Error Handling

Description:
Type: Task
Sprint: Sprint 6
Points: 5
Assignee: Sollomon, Destin
Priority: P1-High

- [ ] Consistent loading states
- [ ] User-friendly error messages
- [ ] Empty states for all lists
- [ ] Form validation feedback
- [ ] Accessibility improvements
```

**Item 37:**
```
Title: [TASK] Localization Completion

Description:
Type: Task
Sprint: Sprint 6
Points: 3
Assignee: Destin
Priority: P1-High

- [ ] All UI strings in translation files
- [ ] Spanish translations complete
- [ ] Date/time formatting by locale
- [ ] Test language switching
```

**Item 38:**
```
Title: [TASK] Documentation

Description:
Type: Task
Sprint: Sprint 6
Points: 3
Assignee: Simon
Priority: P1-High

- [ ] README with setup instructions
- [ ] API documentation (Postman collection)
- [ ] Architecture document
- [ ] User guide (1-page quick start)
```

**Item 39:**
```
Title: [TASK] Demo Preparation

Description:
Type: Task
Sprint: Sprint 6
Points: 5
Assignee: Simon
Priority: P0-Critical

- [ ] Demo script with test data
- [ ] Seed database with sample patients
- [ ] Create 2-3 complete switch workflows
- [ ] Record 10-minute demo video
- [ ] Prepare presentation slides
```

---

### BACKLOG COLUMN - Future/Deferred Items

Add these items and place in the **Backlog** column:

---

**Item 40:**
```
Title: [DEFERRED] iOS App Support

Description:
Type: Epic
Priority: P3-Low
Status: Deferred to v2

- Build iOS version of the app
- Test on iOS devices
- Submit to App Store
```

**Item 41:**
```
Title: [DEFERRED] Push Notifications

Description:
Type: Epic
Priority: P2-Medium
Status: Deferred to v2

- FCM integration for Android
- In-app notification center
- Notification preferences
```

**Item 42:**
```
Title: [DEFERRED] Advanced Reporting & Export

Description:

```

**Item 43:**
```
Title: [DEFERRED] Multi-Clinic Support

Description:
Type: Epic
Priority: P2-Medium
Status: Deferred to v2

- Clinic selection in app
- Clinic-specific data isolation
- Admin portal for clinic management
```

**Item 44:**
```
Title: [DEFERRED] Digital Consent Signatures

Description:
Type: Epic
Priority: P2-Medium
Status: Deferred to v2

- Digital signature capture
- PDF consent generation
- Document storage
```

---

## 6. Set Up Milestones

Go to: **Issues → Milestones → New milestone**

| Milestone | Due Date | Description |
|-----------|----------|-------------|
| `Sprint 1-2: Foundation` | (Past date) | Project setup & patient management |
| `Sprint 3-4: Core Features` | (Past date) | Switch workflow & appointments |
| `Sprint 5: Dashboard` | (Past date) | Analytics & profile |
| `Sprint 6: Polish & Demo` | (Your deadline) | Testing, docs, demo prep |
| `MVP Release` | (Final date) | All features complete |

### How to Create a Milestone:

1. Go to **Issues** tab
2. Click **Milestones**
3. Click **New milestone**
4. Enter title, due date, and description
5. Click **Create milestone**

---

## 7. Create Labels

Go to: **Issues → Labels → New label**

| Label | Color (Hex) | Description |
|-------|-------------|-------------|
| `epic` | `#7057ff` | Major feature area |
| `user-story` | `#0052cc` | User story |
| `task` | `#0e8a16` | Technical task |
| `bug` | `#d73a4a` | Bug fix |
| `P0-critical` | `#b60205` | Must have for MVP |
| `P1-high` | `#d93f0b` | Important |
| `P2-medium` | `#fbca04` | Nice to have |
| `P3-low` | `#c5def5` | Can defer |
| `backend` | `#1d76db` | Backend work |
| `mobile` | `#5319e7` | Mobile app work |
| `done` | `#0e8a16` | Completed |
| `in-progress` | `#fbca04` | Currently working |
| `deferred` | `#cccccc` | Moved to future version |

### How to Create a Label:

1. Go to **Issues** tab
2. Click **Labels**
3. Click **New label**
4. Enter name, description, and pick a color
5. Click **Create label**

---

## 8. Project Summary

### Final Board Layout

```
Backlog              Sprint 6 (Current)     In Progress    Review    Done
──────────────────   ────────────────────   ────────────   ───────   ─────────────────
[EPIC] iOS           [EPIC] SMS Notif                                [EPIC] Foundation
[EPIC] Push          [TASK-7.1] Twilio                               [TASK-1.1] - [TASK-1.5]
[EPIC] Reports       [US-7.2] Auto SMS                               [EPIC] Patients
[EPIC] Multi-Clinic  [TASK] E2E Testing                              [US-2.1] - [US-2.3]
[EPIC] Consent       [TASK] Bug Fixes                                [TASK-2.4] - [TASK-2.5]
                     [TASK] UI Polish                                [EPIC] Switches
                     [TASK] Localization                             [TASK-3.1], [US-3.2] - [US-3.4]
                     [TASK] Documentation                            [TASK-3.5]
                     [TASK] Demo Prep                                [EPIC] Appointments
                                                                     [TASK-4.1], [US-4.2] - [US-4.3]
                                                                     [TASK-4.4]
                                                                     [EPIC] Dashboard
                                                                     [TASK-5.1], [US-5.2], [TASK-5.3]
                                                                     [EPIC] Profile
                                                                     [US-6.1] - [US-6.2]
```

### Sprint Velocity Summary

| Sprint | Planned Points | Completed | Status |
|--------|---------------|-----------|--------|
| Sprint 1 | 21 | 21 | COMPLETE |
| Sprint 2 | 24 | 24 | COMPLETE |
| Sprint 3 | 28 | 28 | COMPLETE |
| Sprint 4 | 18 | 18 | COMPLETE |
| Sprint 5 | 21 | 21 | COMPLETE |
| Sprint 6 | 32 | - | IN PROGRESS |
| **Total** | **144** | **112** | **78%** |

### Feature Completion Summary

| Feature Area | Status | Completion |
|--------------|--------|------------|
| Patient Management | COMPLETE | 100% |
| Medications/Drugs | COMPLETE | 100% |
| Biosimilar Switches | COMPLETE | 100% |
| Appointments | COMPLETE | 100% |
| Follow-ups | COMPLETE | 100% |
| Dashboard | COMPLETE | 100% |
| Authentication | COMPLETE | 100% |
| Offline Sync | COMPLETE | 100% |
| Profile/Settings | COMPLETE | 100% |
| Alerts/Escalation | COMPLETE | 100% |
| SMS Notifications | PARTIAL | 10% |

---

## Quick Reference: Views to Add

After setting up the board, you can add additional views:

1. Click **"+ New view"** at the top
2. Choose view type:
   - **Table** - Spreadsheet view with all fields
   - **Roadmap** - Timeline/Gantt view by sprint

This allows your professor to see the backlog in different formats.

---

## Document Information

| Field | Value |
|-------|-------|
| Created | January 2025 |
| Author | Synka Development Team |
| Repository | https://github.com/basanta2029/synka-biosimilar-switch |
| Project Board | https://github.com/users/basanta2029/projects/ |

---

**End of Guide**
