-- CreateTable
CREATE TABLE "CareCircleInvitation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "familyProfileId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "relationshipLabel" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permissions" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "acceptedAt" DATETIME,
    "revokedAt" DATETIME,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CareCircleInvitation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CareCircleInvitation_familyProfileId_fkey" FOREIGN KEY ("familyProfileId") REFERENCES "FamilyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "alternatePhone" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "emergencyProfileId" TEXT,
    CONSTRAINT "EmergencyContact_familyProfileId_fkey" FOREIGN KEY ("familyProfileId") REFERENCES "FamilyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmergencyContact_emergencyProfileId_fkey" FOREIGN KEY ("emergencyProfileId") REFERENCES "EmergencyProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmergencyAccessLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyProfileId" TEXT NOT NULL,
    "emergencyProfileId" TEXT NOT NULL,
    "tokenRef" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestMeta" TEXT,
    CONSTRAINT "EmergencyAccessLog_familyProfileId_fkey" FOREIGN KEY ("familyProfileId") REFERENCES "FamilyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmergencyAccessLog_emergencyProfileId_fkey" FOREIGN KEY ("emergencyProfileId") REFERENCES "EmergencyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CaregiverHandoff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyProfileId" TEXT NOT NULL,
    "outgoingCaregiverId" TEXT,
    "incomingCaregiverId" TEXT,
    "handoffDateTime" DATETIME NOT NULL,
    "summary" TEXT NOT NULL,
    "completedTasks" TEXT,
    "pendingTasks" TEXT,
    "medicationNotes" TEXT,
    "appointmentNotes" TEXT,
    "generalNotes" TEXT,
    "acknowledgmentStatus" TEXT NOT NULL DEFAULT 'pending',
    "acknowledgedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CaregiverHandoff_familyProfileId_fkey" FOREIGN KEY ("familyProfileId") REFERENCES "FamilyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CareCircleMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "familyProfileId" TEXT NOT NULL,
    "invitationId" TEXT,
    "email" TEXT NOT NULL,
    "relationshipLabel" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permissions" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "acceptedAt" DATETIME,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CareCircleMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CareCircleMember_familyProfileId_fkey" FOREIGN KEY ("familyProfileId") REFERENCES "FamilyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CareCircleMember_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "CareCircleInvitation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CareCircleMember" ("active", "createdAt", "email", "id", "permissions", "role", "updatedAt", "userId") SELECT "active", "createdAt", "email", "id", "permissions", "role", "updatedAt", "userId" FROM "CareCircleMember";
DROP TABLE "CareCircleMember";
ALTER TABLE "new_CareCircleMember" RENAME TO "CareCircleMember";
CREATE UNIQUE INDEX "CareCircleMember_invitationId_key" ON "CareCircleMember"("invitationId");
CREATE INDEX "CareCircleMember_familyProfileId_active_idx" ON "CareCircleMember"("familyProfileId", "active");
CREATE UNIQUE INDEX "CareCircleMember_familyProfileId_email_key" ON "CareCircleMember"("familyProfileId", "email");
CREATE TABLE "new_EmergencyProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyProfileId" TEXT NOT NULL,
    "preferredName" TEXT,
    "dateOfBirth" TEXT,
    "bloodType" TEXT,
    "allergies" TEXT,
    "criticalConditions" TEXT,
    "currentMedications" TEXT,
    "primaryDoctor" TEXT,
    "insuranceNote" TEXT,
    "emergencyNote" TEXT,
    "publicFields" TEXT,
    "token" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmergencyProfile_familyProfileId_fkey" FOREIGN KEY ("familyProfileId") REFERENCES "FamilyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EmergencyProfile" ("active", "createdAt", "familyProfileId", "id", "token", "updatedAt") SELECT "active", "createdAt", "familyProfileId", "id", "token", "updatedAt" FROM "EmergencyProfile";
DROP TABLE "EmergencyProfile";
ALTER TABLE "new_EmergencyProfile" RENAME TO "EmergencyProfile";
CREATE UNIQUE INDEX "EmergencyProfile_familyProfileId_key" ON "EmergencyProfile"("familyProfileId");
CREATE UNIQUE INDEX "EmergencyProfile_token_key" ON "EmergencyProfile"("token");
CREATE TABLE "new_FollowUpTask" (
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
INSERT INTO "new_FollowUpTask" ("appointmentId", "completedAt", "createdAt", "details", "dueDate", "familyProfileId", "id", "status", "title", "updatedAt") SELECT "appointmentId", "completedAt", "createdAt", "details", "dueDate", "familyProfileId", "id", "status", "title", "updatedAt" FROM "FollowUpTask";
DROP TABLE "FollowUpTask";
ALTER TABLE "new_FollowUpTask" RENAME TO "FollowUpTask";
CREATE INDEX "FollowUpTask_familyProfileId_dueDate_idx" ON "FollowUpTask"("familyProfileId", "dueDate");
CREATE INDEX "FollowUpTask_appointmentId_status_idx" ON "FollowUpTask"("appointmentId", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "CareCircleInvitation_token_key" ON "CareCircleInvitation"("token");

-- CreateIndex
CREATE INDEX "CareCircleInvitation_familyProfileId_status_idx" ON "CareCircleInvitation"("familyProfileId", "status");

-- CreateIndex
CREATE INDEX "CareCircleInvitation_email_status_idx" ON "CareCircleInvitation"("email", "status");

-- CreateIndex
CREATE INDEX "EmergencyContact_familyProfileId_active_idx" ON "EmergencyContact"("familyProfileId", "active");

-- CreateIndex
CREATE INDEX "EmergencyAccessLog_familyProfileId_timestamp_idx" ON "EmergencyAccessLog"("familyProfileId", "timestamp");

-- CreateIndex
CREATE INDEX "CaregiverHandoff_familyProfileId_handoffDateTime_idx" ON "CaregiverHandoff"("familyProfileId", "handoffDateTime");

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "familyProfileId" TEXT,
    "notificationType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "reminderId" TEXT,
    "dedupKey" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Notification_familyProfileId_fkey" FOREIGN KEY ("familyProfileId") REFERENCES "FamilyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("createdAt", "id", "isRead", "message", "notificationType", "timestamp", "title", "userId") SELECT "createdAt", "id", "isRead", "message", "category", "timestamp", "title", "userId" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE UNIQUE INDEX "Notification_dedupKey_key" ON "Notification"("dedupKey");
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX "Notification_familyProfileId_isRead_idx" ON "Notification"("familyProfileId", "isRead");
CREATE INDEX "Notification_notificationType_timestamp_idx" ON "Notification"("notificationType", "timestamp");
CREATE INDEX "Notification_reminderId_idx" ON "Notification"("reminderId");

CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "familyProfileId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "reminderType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" DATETIME NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "recurrence" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "lastTriggeredAt" DATETIME,
    "nextTriggerAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reminder_familyProfileId_fkey" FOREIGN KEY ("familyProfileId") REFERENCES "FamilyProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reminder_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Reminder_familyProfileId_enabled_nextTriggerAt_idx" ON "Reminder"("familyProfileId", "enabled", "nextTriggerAt");
CREATE UNIQUE INDEX "Reminder_sourceType_sourceId_key" ON "Reminder"("sourceType", "sourceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

