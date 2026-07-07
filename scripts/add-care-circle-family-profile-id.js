/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');

async function addColumn(prisma, sql, label) {
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log(`${label} added`);
  } catch (error) {
    if (!String(error).includes('duplicate column name')) {
      console.error(error);
      process.exitCode = 1;
    }
  }
}

async function main() {
  const prisma = new PrismaClient();
  try {
    await addColumn(prisma, 'ALTER TABLE CareCircleMember ADD COLUMN familyProfileId TEXT', 'care_circle_member.familyProfileId');
    await addColumn(prisma, 'ALTER TABLE CareCircleMember ADD COLUMN relationshipLabel TEXT', 'care_circle_member.relationshipLabel');
    await addColumn(prisma, 'ALTER TABLE CareCircleMember ADD COLUMN acceptedAt DATETIME', 'care_circle_member.acceptedAt');
    await addColumn(prisma, 'ALTER TABLE CareCircleMember ADD COLUMN revokedAt DATETIME', 'care_circle_member.revokedAt');
    await addColumn(prisma, 'ALTER TABLE CareCircleMember ADD COLUMN invitationId TEXT', 'care_circle_member.invitationId');
    await addColumn(prisma, 'ALTER TABLE FollowUpTask ADD COLUMN scheduledAppointmentId TEXT', 'follow_up_task.scheduledAppointmentId');
    await addColumn(prisma, 'ALTER TABLE MedicalRecord ADD COLUMN notes TEXT', 'medical_record.notes');
    await addColumn(prisma, 'ALTER TABLE MedicalRecord ADD COLUMN tags TEXT', 'medical_record.tags');
    await addColumn(prisma, 'ALTER TABLE EmergencyProfile ADD COLUMN preferredName TEXT', 'emergency_profile.preferredName');
    await addColumn(prisma, 'ALTER TABLE EmergencyProfile ADD COLUMN dateOfBirth TEXT', 'emergency_profile.dateOfBirth');
    await addColumn(prisma, 'ALTER TABLE EmergencyProfile ADD COLUMN bloodType TEXT', 'emergency_profile.bloodType');
    await addColumn(prisma, 'ALTER TABLE EmergencyProfile ADD COLUMN allergies TEXT', 'emergency_profile.allergies');
    await addColumn(prisma, 'ALTER TABLE EmergencyProfile ADD COLUMN criticalConditions TEXT', 'emergency_profile.criticalConditions');
    await addColumn(prisma, 'ALTER TABLE EmergencyProfile ADD COLUMN currentMedications TEXT', 'emergency_profile.currentMedications');
    await addColumn(prisma, 'ALTER TABLE EmergencyProfile ADD COLUMN primaryDoctor TEXT', 'emergency_profile.primaryDoctor');
    await addColumn(prisma, 'ALTER TABLE EmergencyProfile ADD COLUMN insuranceNote TEXT', 'emergency_profile.insuranceNote');
    await addColumn(prisma, 'ALTER TABLE EmergencyProfile ADD COLUMN emergencyNote TEXT', 'emergency_profile.emergencyNote');
    await addColumn(prisma, 'ALTER TABLE EmergencyProfile ADD COLUMN publicFields TEXT', 'emergency_profile.publicFields');
    await addColumn(prisma, 'ALTER TABLE EmergencyProfile ADD COLUMN token TEXT', 'emergency_profile.token');
    await addColumn(prisma, 'ALTER TABLE EmergencyProfile ADD COLUMN active BOOLEAN', 'emergency_profile.active');
    await addColumn(prisma, 'ALTER TABLE EmergencyProfile ADD COLUMN expiresAt DATETIME', 'emergency_profile.expiresAt');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS CaregiverHandoff (
        id TEXT PRIMARY KEY NOT NULL,
        familyProfileId TEXT NOT NULL,
        outgoingCaregiverId TEXT,
        incomingCaregiverId TEXT,
        handoffDateTime DATETIME NOT NULL,
        summary TEXT NOT NULL,
        completedTasks TEXT,
        pendingTasks TEXT,
        medicationNotes TEXT,
        appointmentNotes TEXT,
        generalNotes TEXT,
        acknowledgmentStatus TEXT NOT NULL DEFAULT 'pending',
        acknowledgedAt DATETIME,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('caregiver_handoff table ensured');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS CareCircleInvitation (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT NOT NULL,
        familyProfileId TEXT NOT NULL,
        email TEXT NOT NULL,
        relationshipLabel TEXT NOT NULL,
        role TEXT NOT NULL,
        permissions TEXT NOT NULL,
        status TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        acceptedAt DATETIME,
        revokedAt DATETIME,
        expiresAt DATETIME,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('care_circle_invitation table ensured');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS EmergencyContact (
        id TEXT PRIMARY KEY NOT NULL,
        familyProfileId TEXT NOT NULL,
        name TEXT NOT NULL,
        relationship TEXT NOT NULL,
        phone TEXT NOT NULL,
        alternatePhone TEXT,
        priority INTEGER NOT NULL DEFAULT 1,
        notes TEXT,
        active BOOLEAN NOT NULL DEFAULT true,
        emergencyProfileId TEXT,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('emergency_contact table ensured');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS EmergencyAccessLog (
        id TEXT PRIMARY KEY NOT NULL,
        familyProfileId TEXT NOT NULL,
        emergencyProfileId TEXT NOT NULL,
        tokenRef TEXT NOT NULL,
        timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        requestMeta TEXT
      )
    `);
    console.log('emergency_access_log table ensured');
  } finally {
    await prisma.$disconnect();
  }
}

main();
