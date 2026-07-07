-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HealthProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dateOfBirth" TEXT,
    "height" REAL,
    "targetWeight" REAL,
    "activityLevel" TEXT,
    "dietaryPreference" TEXT,
    "allergies" TEXT,
    "foodRestrictions" TEXT,
    "healthGoals" TEXT,
    "sleepWakeTime" TEXT,
    "sleepBedTime" TEXT,
    "preferredUnits" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HealthProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FamilyProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "allergies" TEXT,
    "foodRestrictions" TEXT,
    "dietaryPreference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FamilyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MealEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyProfileId" TEXT NOT NULL,
    "foodName" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "mealType" TEXT NOT NULL,
    "calories" REAL NOT NULL,
    "protein" REAL NOT NULL,
    "carbs" REAL NOT NULL,
    "fats" REAL NOT NULL,
    "fiber" REAL NOT NULL DEFAULT 0,
    "sugar" REAL NOT NULL DEFAULT 0,
    "sodium" REAL NOT NULL DEFAULT 0,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MealEntry_familyProfileId_fkey" FOREIGN KEY ("familyProfileId") REFERENCES "FamilyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WaterEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyProfileId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "beverageType" TEXT NOT NULL DEFAULT 'Water',
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WaterEntry_familyProfileId_fkey" FOREIGN KEY ("familyProfileId") REFERENCES "FamilyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SleepEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyProfileId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "bedtime" DATETIME NOT NULL,
    "wakeTime" DATETIME NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "qualityRating" INTEGER,
    "interruptions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SleepEntry_familyProfileId_fkey" FOREIGN KEY ("familyProfileId") REFERENCES "FamilyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeightEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyProfileId" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "date" TEXT NOT NULL,
    "notes" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WeightEntry_familyProfileId_fkey" FOREIGN KEY ("familyProfileId") REFERENCES "FamilyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkoutEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyProfileId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "distance" REAL,
    "steps" INTEGER,
    "notes" TEXT,
    "date" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkoutEntry_familyProfileId_fkey" FOREIGN KEY ("familyProfileId") REFERENCES "FamilyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Medication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'mg',
    "frequency" TEXT NOT NULL,
    "scheduleTimes" TEXT NOT NULL,
    "instructions" TEXT,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "refillDate" TEXT,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Medication_familyProfileId_fkey" FOREIGN KEY ("familyProfileId") REFERENCES "FamilyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MedicationEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyProfileId" TEXT NOT NULL,
    "medicationId" TEXT NOT NULL,
    "scheduledTime" DATETIME NOT NULL,
    "status" TEXT NOT NULL,
    "timestamp" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MedicationEvent_familyProfileId_fkey" FOREIGN KEY ("familyProfileId") REFERENCES "FamilyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MedicationEvent_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Doctor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "clinic" TEXT NOT NULL,
    "contactInfo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyProfileId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "isVirtual" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "preparationList" TEXT,
    "followUpDate" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_familyProfileId_fkey" FOREIGN KEY ("familyProfileId") REFERENCES "FamilyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FollowUpTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyProfileId" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "scheduledAppointmentId" TEXT,
    "title" TEXT NOT NULL,
    "details" TEXT,
    "dueDate" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FollowUpTask_familyProfileId_fkey" FOREIGN KEY ("familyProfileId") REFERENCES "FamilyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FollowUpTask_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FollowUpTask_scheduledAppointmentId_fkey" FOREIGN KEY ("scheduledAppointmentId") REFERENCES "Appointment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyProfileId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "notes" TEXT,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MedicalRecord_familyProfileId_fkey" FOREIGN KEY ("familyProfileId") REFERENCES "FamilyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MedicalRecord_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyProfileId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TimelineEvent_familyProfileId_fkey" FOREIGN KEY ("familyProfileId") REFERENCES "FamilyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CareCircleMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permissions" TEXT NOT NULL,
    "expiryDate" DATETIME,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CareCircleMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmergencyProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyProfileId" TEXT NOT NULL,
    "bloodGroup" TEXT,
    "emergencyContact" TEXT,
    "criticalAllergies" TEXT,
    "conditions" TEXT,
    "medications" TEXT,
    "emergencyNotes" TEXT,
    "token" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmergencyProfile_familyProfileId_fkey" FOREIGN KEY ("familyProfileId") REFERENCES "FamilyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "ipAddress" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "HealthProfile_userId_key" ON "HealthProfile"("userId");

-- CreateIndex
CREATE INDEX "MealEntry_familyProfileId_timestamp_idx" ON "MealEntry"("familyProfileId", "timestamp");

-- CreateIndex
CREATE INDEX "WaterEntry_familyProfileId_timestamp_idx" ON "WaterEntry"("familyProfileId", "timestamp");

-- CreateIndex
CREATE INDEX "SleepEntry_familyProfileId_bedtime_idx" ON "SleepEntry"("familyProfileId", "bedtime");

-- CreateIndex
CREATE UNIQUE INDEX "SleepEntry_familyProfileId_date_key" ON "SleepEntry"("familyProfileId", "date");

-- CreateIndex
CREATE INDEX "WeightEntry_familyProfileId_timestamp_idx" ON "WeightEntry"("familyProfileId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "WeightEntry_familyProfileId_date_key" ON "WeightEntry"("familyProfileId", "date");

-- CreateIndex
CREATE INDEX "WorkoutEntry_familyProfileId_timestamp_idx" ON "WorkoutEntry"("familyProfileId", "timestamp");

-- CreateIndex
CREATE INDEX "MedicationEvent_familyProfileId_scheduledTime_idx" ON "MedicationEvent"("familyProfileId", "scheduledTime");

-- CreateIndex
CREATE INDEX "FollowUpTask_familyProfileId_dueDate_idx" ON "FollowUpTask"("familyProfileId", "dueDate");

-- CreateIndex
CREATE INDEX "FollowUpTask_appointmentId_status_idx" ON "FollowUpTask"("appointmentId", "status");

-- CreateIndex
CREATE INDEX "MedicalRecord_familyProfileId_date_idx" ON "MedicalRecord"("familyProfileId", "date");

-- CreateIndex
CREATE INDEX "TimelineEvent_familyProfileId_timestamp_idx" ON "TimelineEvent"("familyProfileId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "CareCircleMember_userId_email_key" ON "CareCircleMember"("userId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "EmergencyProfile_familyProfileId_key" ON "EmergencyProfile"("familyProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "EmergencyProfile_token_key" ON "EmergencyProfile"("token");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "AuditLog_userId_timestamp_idx" ON "AuditLog"("userId", "timestamp");
