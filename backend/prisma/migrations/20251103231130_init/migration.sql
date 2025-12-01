-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "dateOfBirth" DATETIME NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'EN',
    "allergies" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "drugs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "costPerMonth" REAL NOT NULL,
    "approvedForSwitch" BOOLEAN NOT NULL DEFAULT true,
    "therapeuticClass" TEXT NOT NULL,
    "manufacturer" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "switch_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "fromDrugId" TEXT NOT NULL,
    "toDrugId" TEXT NOT NULL,
    "switchDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "eligibilityNotes" TEXT,
    "consentObtained" BOOLEAN NOT NULL DEFAULT false,
    "consentTimestamp" DATETIME,
    "consentText" TEXT,
    "completionDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "switch_records_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "switch_records_fromDrugId_fkey" FOREIGN KEY ("fromDrugId") REFERENCES "drugs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "switch_records_toDrugId_fkey" FOREIGN KEY ("toDrugId") REFERENCES "drugs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "switchId" TEXT NOT NULL,
    "appointmentType" TEXT NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "appointments_switchId_fkey" FOREIGN KEY ("switchId") REFERENCES "switch_records" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "follow_ups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointmentId" TEXT NOT NULL,
    "completedAt" DATETIME,
    "hasSideEffects" BOOLEAN NOT NULL DEFAULT false,
    "sideEffectSeverity" TEXT,
    "sideEffectDescription" TEXT,
    "stillTakingMedication" BOOLEAN NOT NULL,
    "needsEscalation" BOOLEAN NOT NULL DEFAULT false,
    "patientSatisfaction" INTEGER,
    "notes" TEXT,
    CONSTRAINT "follow_ups_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sms_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "sentAt" DATETIME,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "twilioSid" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sms_logs_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sms_logs_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "switchId" TEXT,
    "followUpId" TEXT,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "reviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "patients_phone_key" ON "patients"("phone");

-- CreateIndex
CREATE INDEX "patients_phone_idx" ON "patients"("phone");

-- CreateIndex
CREATE INDEX "drugs_type_therapeuticClass_idx" ON "drugs"("type", "therapeuticClass");

-- CreateIndex
CREATE INDEX "switch_records_patientId_idx" ON "switch_records"("patientId");

-- CreateIndex
CREATE INDEX "switch_records_status_idx" ON "switch_records"("status");

-- CreateIndex
CREATE INDEX "appointments_scheduledAt_idx" ON "appointments"("scheduledAt");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "appointments_patientId_idx" ON "appointments"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "follow_ups_appointmentId_key" ON "follow_ups"("appointmentId");

-- CreateIndex
CREATE INDEX "sms_logs_deliveryStatus_idx" ON "sms_logs"("deliveryStatus");

-- CreateIndex
CREATE INDEX "alerts_reviewed_idx" ON "alerts"("reviewed");

-- CreateIndex
CREATE INDEX "alerts_createdAt_idx" ON "alerts"("createdAt");
