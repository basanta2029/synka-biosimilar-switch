# Synka - Software Architecture Document

**Project:** Synka - Biosimilar Switch Kit MVP
**Version:** 1.0
**Date:** January 2025
**Team:** Howard University Senior Project Team

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Architecture Goals & Constraints](#3-architecture-goals--constraints)
4. [System Architecture](#4-system-architecture)
5. [Technology Stack](#5-technology-stack)
6. [Component Architecture](#6-component-architecture)
7. [Data Architecture](#7-data-architecture)
8. [API Architecture](#8-api-architecture)
9. [Security Architecture](#9-security-architecture)
10. [Offline-First Architecture](#10-offline-first-architecture)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Architecture Decisions](#12-architecture-decisions)

---

## 1. Executive Summary

Synka is a healthcare mobile application designed to help clinics in emerging markets safely transition patients from expensive brand-name biologic medications to clinically-equivalent biosimilar alternatives. The system reduces healthcare costs by 30-70% while maintaining patient safety through structured follow-up protocols.

### Key Architectural Characteristics

| Characteristic | Description |
|---------------|-------------|
| **Offline-First** | Full functionality without internet; sync when connected |
| **Mobile-First** | Android-primary React Native application |
| **Scalable** | Support 10,000+ patients per clinic |
| **Secure** | JWT authentication, HTTPS, encrypted local storage |
| **Bilingual** | Full English/Spanish localization |

---

## 2. System Overview

### 2.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SYNKA SYSTEM                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        PRESENTATION LAYER                             │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐   │   │
│  │  │  Mobile App     │  │  Web Dashboard  │  │  Admin Portal       │   │   │
│  │  │  (React Native) │  │  (React)        │  │  (Future)           │   │   │
│  │  │  - Android      │  │  - Metrics      │  │                     │   │   │
│  │  │  - iOS (Future) │  │  - Reports      │  │                     │   │   │
│  │  └────────┬────────┘  └────────┬────────┘  └─────────────────────┘   │   │
│  └───────────┼────────────────────┼─────────────────────────────────────┘   │
│              │                    │                                          │
│              ▼                    ▼                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                          API GATEWAY                                  │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │  Express.js REST API (Node.js + TypeScript)                    │  │   │
│  │  │  - Authentication (JWT)                                         │  │   │
│  │  │  - Rate Limiting                                                │  │   │
│  │  │  - Request Validation                                           │  │   │
│  │  │  - Error Handling                                               │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│              │                                                               │
│              ▼                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        SERVICE LAYER                                  │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────────┐ │   │
│  │  │   Auth     │ │  Patient   │ │   Drug     │ │  Switch            │ │   │
│  │  │  Service   │ │  Service   │ │  Service   │ │  Service           │ │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────────────┘ │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────────┐ │   │
│  │  │ Appt       │ │ Follow-up  │ │   SMS      │ │  Dashboard         │ │   │
│  │  │ Service    │ │  Service   │ │  Service   │ │  Service           │ │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│              │                                                               │
│              ▼                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         DATA LAYER                                    │   │
│  │  ┌────────────────────┐       ┌────────────────────────────────────┐ │   │
│  │  │  Prisma ORM        │       │  External Services                 │ │   │
│  │  │  - Migrations      │       │  ┌──────────────────────────────┐  │ │   │
│  │  │  - Query Builder   │       │  │  Twilio SMS API              │  │ │   │
│  │  └─────────┬──────────┘       │  └──────────────────────────────┘  │ │   │
│  │            │                  └────────────────────────────────────┘ │   │
│  │            ▼                                                         │   │
│  │  ┌────────────────────┐                                              │   │
│  │  │  SQLite Database   │                                              │   │
│  │  │  (PostgreSQL Prod) │                                              │   │
│  │  └────────────────────┘                                              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Mobile App Architecture (Offline-First)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MOBILE APPLICATION                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        UI LAYER (React Native)                         │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐  │ │
│  │  │   Screens   │ │ Components  │ │ Navigation  │ │  Forms          │  │ │
│  │  │ - Auth      │ │ - Button    │ │ - Stack     │ │ - Formik        │  │ │
│  │  │ - Patients  │ │ - Input     │ │ - Tab       │ │ - Yup           │  │ │
│  │  │ - Switches  │ │ - Card      │ │ - Drawer    │ │                 │  │ │
│  │  │ - Dashboard │ │ - Modal     │ │             │ │                 │  │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                              │                                               │
│                              ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                      STATE MANAGEMENT LAYER                            │ │
│  │  ┌───────────────────┐  ┌────────────────────┐  ┌──────────────────┐  │ │
│  │  │  Zustand Store    │  │  React Query       │  │  Context API     │  │ │
│  │  │  - Auth State     │  │  - Server State    │  │  - Theme         │  │ │
│  │  │  - UI State       │  │  - Caching         │  │  - Localization  │  │ │
│  │  │  - Offline State  │  │  - Sync Status     │  │                  │  │ │
│  │  └───────────────────┘  └────────────────────┘  └──────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                              │                                               │
│                              ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        SERVICE LAYER                                   │ │
│  │  ┌────────────────┐  ┌────────────────┐  ┌──────────────────────────┐ │ │
│  │  │  Sync Service  │  │  API Client    │  │  Validation Service     │ │ │
│  │  │  - Queue Mgmt  │  │  - Axios       │  │  - Schema Validation    │ │ │
│  │  │  - Retry Logic │  │  - Interceptors│  │  - Form Validation      │ │ │
│  │  │  - Conflict    │  │  - JWT Auth    │  │                          │ │ │
│  │  └────────────────┘  └────────────────┘  └──────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                              │                                               │
│                              ▼                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         DATA LAYER                                     │ │
│  │  ┌────────────────────────────────────────────────────────────────┐   │ │
│  │  │              LOCAL SQLITE DATABASE                              │   │ │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │   │ │
│  │  │  │ Patients │ │  Drugs   │ │ Switches │ │  Sync Queue      │   │   │ │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │   │ │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │   │ │
│  │  │  │  Appts   │ │Follow-ups│ │ SMS Logs │ │     Alerts       │   │   │ │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │   │ │
│  │  └────────────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Architecture Goals & Constraints

### 3.1 Architecture Goals

| Goal | Priority | Description |
|------|----------|-------------|
| **Offline Operation** | Critical | App must function 7+ days without internet |
| **Data Integrity** | Critical | Zero data loss during sync operations |
| **Performance** | High | <3s cold start, <200ms search |
| **Scalability** | High | Support 10,000+ patients per clinic |
| **Security** | High | HIPAA-aligned data protection |
| **Maintainability** | Medium | Clean code, documentation |
| **Extensibility** | Medium | Easy to add new features |

### 3.2 Constraints

| Constraint | Impact |
|------------|--------|
| **12-week timeline** | MVP scope only; defer advanced features |
| **5-person team** | Parallel development required |
| **Android-first** | iOS deferred to v2 |
| **Low-connectivity users** | Offline-first mandatory |
| **Bilingual requirement** | All UI in English/Spanish |
| **Budget limitations** | Use free tiers where possible |

---

## 4. System Architecture

### 4.1 Three-Tier Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      PRESENTATION TIER                               │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  React Native Mobile App         │  React Web Dashboard       │  │
│  │  - Patient Management            │  - Metrics & Reports       │  │
│  │  - Switch Workflow               │  - Alert Management        │  │
│  │  - Offline Operation             │                            │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼ HTTPS/REST
┌─────────────────────────────────────────────────────────────────────┐
│                       APPLICATION TIER                               │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  Express.js API Server (Node.js + TypeScript)                 │  │
│  │  - RESTful Endpoints                                          │  │
│  │  - Business Logic                                             │  │
│  │  - Authentication/Authorization                               │  │
│  │  - Data Validation                                            │  │
│  │  - Error Handling                                             │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼ Prisma ORM
┌─────────────────────────────────────────────────────────────────────┐
│                          DATA TIER                                   │
│  ┌─────────────────────┐  ┌──────────────────────────────────────┐  │
│  │  SQLite (Dev)       │  │  External Services                   │  │
│  │  PostgreSQL (Prod)  │  │  - Twilio (SMS)                      │  │
│  │  - 8 Core Tables    │  │  - Future: Email, Push Notifications │  │
│  └─────────────────────┘  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW: PATIENT CREATION                         │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────┐    ┌───────────┐    ┌──────────┐    ┌─────────┐    ┌────────────┐
│  User   │───▶│  UI Form  │───▶│ Validate │───▶│ Generate│───▶│ Save to    │
│  Input  │    │  (Formik) │    │  (Yup)   │    │  UUID   │    │ Local DB   │
└─────────┘    └───────────┘    └──────────┘    └─────────┘    └────────────┘
                                                                      │
                                                                      ▼
┌─────────┐    ┌───────────┐    ┌──────────┐    ┌─────────┐    ┌────────────┐
│ Server  │◀───│ Process   │◀───│ Sync     │◀───│ Add to  │◀───│ Check      │
│ Database│    │ Queue     │    │ Service  │    │ Queue   │    │ Network    │
└─────────┘    └───────────┘    └──────────┘    └─────────┘    └────────────┘
     │
     ▼
┌────────────────┐
│ Update Local   │
│ DB (synced=1)  │
└────────────────┘


┌──────────────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW: SWITCH WORKFLOW                             │
└──────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐      ┌───────────────┐      ┌───────────────┐
│ Select      │─────▶│ Eligibility   │─────▶│ Select        │
│ Patient     │      │ Check         │      │ Biosimilar    │
└─────────────┘      └───────────────┘      └───────────────┘
                                                   │
                                                   ▼
┌─────────────┐      ┌───────────────┐      ┌───────────────┐
│ Create      │◀─────│ Record        │◀─────│ Schedule      │
│ Switch      │      │ Consent       │      │ Appointments  │
└─────────────┘      └───────────────┘      └───────────────┘
     │
     ▼
┌─────────────┐      ┌───────────────┐      ┌───────────────┐
│ Queue SMS   │─────▶│ Day-3         │─────▶│ Day-14        │
│ Reminders   │      │ Follow-up     │      │ Follow-up     │
└─────────────┘      └───────────────┘      └───────────────┘
```

---

## 5. Technology Stack

### 5.1 Frontend (Mobile)

| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.82.1 | Cross-platform mobile framework |
| TypeScript | 5.x | Type-safe JavaScript |
| React Navigation | 7.x | Navigation management |
| Zustand | 4.x | Client state management |
| React Query | 5.x | Server state & caching |
| SQLite | - | Local offline database |
| Formik + Yup | - | Form handling & validation |
| Axios | 1.5+ | HTTP client |
| React Native Paper | 5.x | Material Design components |
| i18next | - | Internationalization |
| NetInfo | - | Network connectivity detection |

### 5.2 Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18 LTS | JavaScript runtime |
| Express.js | 5.x | Web framework |
| TypeScript | 5.x | Type-safe JavaScript |
| Prisma | 6.x | ORM for database access |
| SQLite/PostgreSQL | - | Database (dev/prod) |
| JWT | - | Authentication tokens |
| bcryptjs | - | Password hashing |
| Twilio SDK | - | SMS integration |

### 5.3 Development Tools

| Tool | Purpose |
|------|---------|
| Git/GitHub | Version control |
| VS Code | IDE |
| Android Studio | Android emulator |
| Postman | API testing |
| Metro Bundler | React Native bundling |

---

## 6. Component Architecture

### 6.1 Mobile App Component Hierarchy

```
App.tsx
├── NavigationContainer
│   └── RootNavigator
│       ├── AuthNavigator (Unauthenticated)
│       │   ├── LoginScreen
│       │   └── RegisterScreen
│       │
│       └── MainNavigator (Authenticated)
│           ├── DashboardTab
│           │   └── DashboardScreen
│           │       ├── MetricsCard[]
│           │       ├── RecentSwitchesList
│           │       └── AlertsSection
│           │
│           ├── PatientsTab
│           │   └── PatientsNavigator (Stack)
│           │       ├── PatientListScreen
│           │       │   ├── SearchBar
│           │       │   ├── PatientCard[]
│           │       │   └── FAB (Add Patient)
│           │       ├── PatientFormScreen
│           │       │   ├── FormInputs
│           │       │   ├── DatePicker
│           │       │   └── LanguageToggle
│           │       ├── PatientDetailScreen
│           │       │   ├── PatientInfoCard
│           │       │   ├── SwitchHistory
│           │       │   └── AppointmentsList
│           │       └── SwitchWorkflowScreen
│           │           ├── EligibilityStep
│           │           ├── DrugSelectionStep
│           │           ├── SchedulingStep
│           │           ├── ConsentStep
│           │           └── SummaryStep
│           │
│           ├── AppointmentsTab
│           │   └── AppointmentsScreen
│           │       ├── TodaySection
│           │       ├── UpcomingSection
│           │       └── FollowUpFormModal
│           │
│           └── ProfileTab
│               └── ProfileScreen
│                   ├── UserInfoCard
│                   ├── LanguageSettings
│                   └── LogoutButton
```

### 6.2 Backend Service Architecture

```
backend/src/
├── index.ts                 # Application entry point
├── config/
│   └── index.ts            # Environment configuration
├── routes/
│   ├── authRoutes.ts       # POST /auth/register, /auth/login
│   ├── patientRoutes.ts    # CRUD /patients
│   ├── drugRoutes.ts       # GET /drugs
│   ├── switchRoutes.ts     # CRUD /switches
│   ├── appointmentRoutes.ts# CRUD /appointments
│   ├── followUpRoutes.ts   # CRUD /follow-ups
│   ├── smsRoutes.ts        # POST /sms/send, webhook
│   └── dashboardRoutes.ts  # GET /dashboard/*
├── controllers/
│   ├── authController.ts   # Handle auth requests
│   ├── patientController.ts# Handle patient requests
│   ├── drugController.ts   # Handle drug requests
│   └── switchController.ts # Handle switch requests
├── services/
│   ├── authService.ts      # Authentication logic
│   ├── patientService.ts   # Patient business logic
│   ├── drugService.ts      # Drug repository
│   └── switchService.ts    # Switch workflow logic
├── middleware/
│   ├── auth.ts             # JWT verification
│   ├── validate.ts         # Request validation
│   └── errorHandler.ts     # Global error handling
└── utils/
    └── helpers.ts          # Utility functions
```

---

## 7. Data Architecture

### 7.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ENTITY RELATIONSHIP DIAGRAM                           │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │     User     │
    ├──────────────┤
    │ id (PK)      │
    │ email        │
    │ password     │
    │ name         │
    │ role         │
    └──────────────┘

    ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
    │   Patient    │────────▶│ SwitchRecord │◀────────│     Drug     │
    ├──────────────┤   1:N   ├──────────────┤   N:1   ├──────────────┤
    │ id (PK)      │         │ id (PK)      │         │ id (PK)      │
    │ name         │         │ patientId(FK)│         │ name         │
    │ phone        │         │ fromDrugId   │         │ type         │
    │ dateOfBirth  │         │ toDrugId(FK) │         │ costPerMonth │
    │ language     │         │ switchDate   │         │ therapeutic  │
    │ diagnosis    │         │ status       │         │ Class        │
    │ allergies    │         │ consent      │         └──────────────┘
    └──────────────┘         └──────────────┘
          │                        │
          │ 1:N                    │ 1:N
          ▼                        ▼
    ┌──────────────┐         ┌──────────────┐
    │ Appointment  │────────▶│   FollowUp   │
    ├──────────────┤   1:1   ├──────────────┤
    │ id (PK)      │         │ id (PK)      │
    │ patientId(FK)│         │ appointmentId│
    │ switchId(FK) │         │ hasSideEffects
    │ type         │         │ severity     │
    │ scheduledAt  │         │ stillTaking  │
    │ status       │         │ satisfaction │
    └──────────────┘         └──────────────┘
          │
          │ 1:N
          ▼
    ┌──────────────┐         ┌──────────────┐
    │    SmsLog    │         │    Alert     │
    ├──────────────┤         ├──────────────┤
    │ id (PK)      │         │ id (PK)      │
    │ patientId(FK)│         │ type         │
    │ message      │         │ patientId    │
    │ language     │         │ severity     │
    │ status       │         │ reviewed     │
    │ twilioSid    │         │ description  │
    └──────────────┘         └──────────────┘
```

### 7.2 Database Schema Summary

| Table | Description | Key Fields |
|-------|-------------|------------|
| **users** | Staff authentication | id, email, password, role |
| **patients** | Patient records | id, name, phone, DOB, language, diagnosis |
| **drugs** | Medication catalog | id, name, type, cost, therapeuticClass |
| **switch_records** | Biosimilar switches | id, patientId, fromDrug, toDrug, status |
| **appointments** | Follow-up visits | id, patientId, switchId, type, scheduledAt |
| **follow_ups** | Visit outcomes | id, appointmentId, sideEffects, severity |
| **sms_logs** | SMS history | id, patientId, message, status |
| **alerts** | Severe reaction alerts | id, patientId, severity, reviewed |
| **sync_queue** | Offline operations | id, entityType, action, payload |

---

## 8. API Architecture

### 8.1 RESTful API Endpoints

```
BASE URL: /api/v1

AUTHENTICATION
├── POST   /auth/register        # Register new user
├── POST   /auth/login           # Login user
└── GET    /auth/me              # Get current user

PATIENTS
├── GET    /patients             # List patients (search, pagination)
├── POST   /patients             # Create patient
├── GET    /patients/:id         # Get patient details
├── PUT    /patients/:id         # Update patient
└── DELETE /patients/:id         # Delete patient

DRUGS
├── GET    /drugs                # List drugs (filter by type)
├── GET    /drugs/:id            # Get drug details
├── GET    /drugs/:id/biosimilars# Get biosimilar alternatives
└── POST   /drugs/seed           # Seed sample drugs

SWITCHES
├── POST   /switches             # Create switch with appointments
├── GET    /switches             # List switches
├── GET    /switches/:id         # Get switch details
└── PUT    /switches/:id         # Update switch status

APPOINTMENTS
├── GET    /appointments         # List appointments (date, status)
├── POST   /appointments         # Create appointment
└── PUT    /appointments/:id     # Update appointment

FOLLOW-UPS
├── POST   /follow-ups           # Record follow-up
└── GET    /follow-ups           # Get follow-up by appointment

SMS
├── POST   /sms/send             # Send manual SMS
└── POST   /sms/webhook          # Twilio delivery webhook

DASHBOARD
├── GET    /dashboard/metrics    # Program metrics
├── GET    /dashboard/recent-switches
└── GET    /dashboard/alerts     # Alerts list

SYNC
└── POST   /sync                 # Batch sync offline data
```

### 8.2 API Response Format

```json
// Success Response
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}

// Error Response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid phone number format",
    "details": { "field": "phone" }
  }
}

// Paginated Response
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

---

## 9. Security Architecture

### 9.1 Authentication Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        AUTHENTICATION FLOW                                │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────┐                ┌──────────┐                ┌──────────┐
│  Client │                │  Server  │                │ Database │
└────┬────┘                └────┬─────┘                └────┬─────┘
     │                          │                           │
     │ 1. POST /auth/login      │                           │
     │    {email, password}     │                           │
     │─────────────────────────▶│                           │
     │                          │                           │
     │                          │ 2. Find user by email     │
     │                          │──────────────────────────▶│
     │                          │                           │
     │                          │ 3. Return user record     │
     │                          │◀──────────────────────────│
     │                          │                           │
     │                          │ 4. Compare password       │
     │                          │    (bcrypt.compare)       │
     │                          │                           │
     │                          │ 5. Generate JWT           │
     │                          │    (7-day expiration)     │
     │                          │                           │
     │ 6. Return token + user   │                           │
     │◀─────────────────────────│                           │
     │                          │                           │
     │ 7. Store token in        │                           │
     │    AsyncStorage          │                           │
     │                          │                           │
     │ 8. Include token in      │                           │
     │    Authorization header  │                           │
     │    for all requests      │                           │
     │─────────────────────────▶│                           │
     │                          │                           │
```

### 9.2 Security Measures

| Layer | Measure | Implementation |
|-------|---------|----------------|
| **Transport** | HTTPS | TLS 1.2+ encryption |
| **Authentication** | JWT | 7-day token expiration |
| **Password** | Hashing | bcryptjs with salt |
| **API** | Rate Limiting | 100 requests/min per user |
| **Input** | Validation | express-validator |
| **Data** | Local Encryption | SQLCipher (future) |
| **Session** | Timeout | 30-minute inactivity |

---

## 10. Offline-First Architecture

### 10.1 Sync Queue Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     OFFLINE-FIRST SYNC ARCHITECTURE                       │
└──────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────────────┐
                         │    USER ACTION          │
                         │    (Create Patient)     │
                         └───────────┬─────────────┘
                                     │
                                     ▼
                         ┌─────────────────────────┐
                         │   SAVE TO LOCAL         │
                         │   SQLite Database       │
                         │   (synced = false)      │
                         └───────────┬─────────────┘
                                     │
                                     ▼
                         ┌─────────────────────────┐
                         │   ADD TO SYNC QUEUE     │
                         │   {entity, action,      │
                         │    payload, timestamp}  │
                         └───────────┬─────────────┘
                                     │
                                     ▼
                         ┌─────────────────────────┐
                         │   CHECK NETWORK         │
                         │   STATUS (NetInfo)      │
                         └───────────┬─────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼ ONLINE               │               OFFLINE▼
    ┌─────────────────────┐          │        ┌─────────────────────┐
    │ PROCESS SYNC QUEUE  │          │        │ QUEUE PERSISTS      │
    │ - POST to server    │          │        │ - Wait for network  │
    │ - Mark synced=true  │          │        │ - Auto-retry every  │
    │ - Remove from queue │          │        │   30 seconds        │
    └─────────────────────┘          │        └─────────────────────┘
                                     │
                                     │ ON RECONNECTION
                                     ▼
                         ┌─────────────────────────┐
                         │   TRIGGER SYNC          │
                         │   - Process all queued  │
                         │   - Retry up to 3x      │
                         │   - Handle conflicts    │
                         └─────────────────────────┘
```

### 10.2 Conflict Resolution Strategy

```
CONFLICT RESOLUTION: SERVER WINS

┌────────────────────┐     ┌────────────────────┐
│   LOCAL CHANGE     │     │   SERVER STATE     │
│   timestamp: T1    │     │   timestamp: T2    │
│   data: {...}      │     │   data: {...}      │
└─────────┬──────────┘     └─────────┬──────────┘
          │                          │
          └──────────┬───────────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │  COMPARE TIMESTAMPS │
          │  IF T2 > T1         │
          │  → Server wins      │
          │  → Overwrite local  │
          │  → Log conflict     │
          └─────────────────────┘
```

### 10.3 Sync Service Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| **Sync Interval** | 30 seconds | Background sync frequency |
| **Max Retries** | 3 | Retry attempts per item |
| **Retry Backoff** | Exponential | 1s → 2s → 4s |
| **Queue Limit** | 1000 items | Max pending operations |
| **Conflict Strategy** | Server Wins | Remote is source of truth |

---

## 11. Deployment Architecture

### 11.1 Development Environment

```
┌─────────────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT ENVIRONMENT                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐    ┌──────────────────┐    ┌───────────────┐ │
│  │  Developer       │    │  Backend Server  │    │  Database     │ │
│  │  Machine         │    │  localhost:3000  │    │  SQLite       │ │
│  │                  │    │                  │    │  (dev.db)     │ │
│  │  ┌────────────┐  │    │  ┌────────────┐  │    │               │ │
│  │  │ Metro      │  │───▶│  │ Express.js │  │───▶│               │ │
│  │  │ Bundler    │  │    │  │ + Prisma   │  │    │               │ │
│  │  └────────────┘  │    │  └────────────┘  │    │               │ │
│  │                  │    │                  │    │               │ │
│  │  ┌────────────┐  │    │                  │    │               │ │
│  │  │ Android    │  │    │                  │    │               │ │
│  │  │ Emulator   │  │    │                  │    │               │ │
│  │  └────────────┘  │    │                  │    │               │ │
│  └──────────────────┘    └──────────────────┘    └───────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 11.2 Production Environment (Future)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION ENVIRONMENT                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐    ┌──────────────────┐    ┌───────────────┐ │
│  │  Mobile App      │    │  Cloud Hosting   │    │  PostgreSQL   │ │
│  │  (Android APK)   │    │  (Railway/Render)│    │  Database     │ │
│  │                  │    │                  │    │               │ │
│  │  ┌────────────┐  │    │  ┌────────────┐  │    │  ┌─────────┐  │ │
│  │  │ Play Store │  │───▶│  │ Node.js    │  │───▶│  │ Managed │  │ │
│  │  │ Distribution│  │    │  │ Container  │  │    │  │ Instance│  │ │
│  │  └────────────┘  │    │  └────────────┘  │    │  └─────────┘  │ │
│  │                  │    │                  │    │               │ │
│  │                  │    │  ┌────────────┐  │    │               │ │
│  │                  │    │  │ HTTPS/TLS  │  │    │               │ │
│  │                  │    │  └────────────┘  │    │               │ │
│  └──────────────────┘    └──────────────────┘    └───────────────┘ │
│                                 │                                    │
│                                 ▼                                    │
│                          ┌──────────────┐                           │
│                          │   Twilio     │                           │
│                          │   SMS API    │                           │
│                          └──────────────┘                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 12. Architecture Decisions

### 12.1 Key Architecture Decision Records (ADRs)

#### ADR-001: React Native for Mobile Development

**Decision:** Use React Native instead of native Android/iOS development

**Rationale:**
- Single codebase for Android (and future iOS)
- JavaScript/TypeScript expertise on team
- Rich ecosystem of libraries
- Faster development cycle

**Trade-offs:**
- Slightly larger app size
- Some performance overhead vs native

---

#### ADR-002: SQLite for Offline Storage

**Decision:** Use SQLite for local data persistence

**Rationale:**
- Proven reliability for mobile apps
- Supports complex queries
- No external dependencies
- Works well offline

**Trade-offs:**
- Limited to device storage capacity
- No built-in sync (custom implementation required)

---

#### ADR-003: Server-Wins Conflict Resolution

**Decision:** When sync conflicts occur, server data takes precedence

**Rationale:**
- Simpler implementation
- Server is source of truth
- Reduces data inconsistency risks
- Conflicts are logged for audit

**Trade-offs:**
- Local changes may be lost
- User notification required when overwritten

---

#### ADR-004: JWT for Authentication

**Decision:** Use JSON Web Tokens for API authentication

**Rationale:**
- Stateless authentication
- Works well with mobile apps
- Industry standard
- Supports offline token validation

**Trade-offs:**
- Token revocation is complex
- Longer token = larger requests

---

#### ADR-005: Zustand + React Query for State Management

**Decision:** Use Zustand for client state and React Query for server state

**Rationale:**
- Separation of concerns
- React Query handles caching, refetching
- Zustand is lightweight for UI state
- Both have excellent TypeScript support

**Trade-offs:**
- Two libraries instead of one
- Learning curve for team

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 2025 | Team | Initial architecture document |

---

**Prepared by:** Howard University Senior Project Team
**Project:** Synka - Biosimilar Switch Kit MVP
