import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with realistic development data...');

  // 1. Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.emergencyProfile.deleteMany();
  await prisma.careCircleMember.deleteMany();
  await prisma.timelineEvent.deleteMany();
  await prisma.medicalRecord.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.medicationEvent.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.workoutEntry.deleteMany();
  await prisma.weightEntry.deleteMany();
  await prisma.sleepEntry.deleteMany();
  await prisma.waterEntry.deleteMany();
  await prisma.mealEntry.deleteMany();
  await prisma.familyProfile.deleteMany();
  await prisma.healthProfile.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Doctors
  const drSharma = await prisma.doctor.create({
    data: {
      name: 'Dr. Sharma',
      specialty: 'Cardiologist',
      clinic: 'City Care Clinic',
      contactInfo: '+1-555-0199',
    },
  });

  const drAnjali = await prisma.doctor.create({
    data: {
      name: 'Dr. Anjali',
      specialty: 'Pediatrician',
      clinic: 'Kids First Clinic',
      contactInfo: '+1-555-0122',
    },
  });

  // 3. Create Demo User
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'sompa@wellsync.com',
      password: hashedPassword,
      name: 'Sompa',
    },
  });

  // 4. Create Health Profile
  await prisma.healthProfile.create({
    data: {
      userId: user.id,
      dateOfBirth: '1990-05-15',
      height: 175,
      targetWeight: 68,
      activityLevel: 'MODERATELY_ACTIVE',
      dietaryPreference: 'VEGETARIAN',
      allergies: 'Peanuts, Penicillin',
      foodRestrictions: 'High-sodium foods',
      healthGoals: 'Gradual weight management, Improve sleep consistency, Stay hydrated',
      sleepWakeTime: '06:30',
      sleepBedTime: '22:30',
      preferredUnits: 'METRIC',
      timezone: 'UTC',
    },
  });

  // 5. Create Family Profiles
  const selfProfile = await prisma.familyProfile.create({
    data: {
      userId: user.id,
      name: 'Sompa',
      relationship: 'SELF',
      allergies: 'Peanuts, Penicillin',
      foodRestrictions: 'High-sodium foods',
      dietaryPreference: 'VEGETARIAN',
    },
  });

  const daughterProfile = await prisma.familyProfile.create({
    data: {
      userId: user.id,
      name: 'Sarah (Daughter)',
      relationship: 'CHILD',
      allergies: 'Peanuts',
      foodRestrictions: 'Egg',
      dietaryPreference: 'VEGETARIAN',
    },
  });

  const fatherProfile = await prisma.familyProfile.create({
    data: {
      userId: user.id,
      name: 'John (Father)',
      relationship: 'PARENT',
      allergies: 'None',
      foodRestrictions: 'High-sodium foods, Red meat',
      dietaryPreference: 'OMNIVORE',
    },
  });

  // 6. Create Medications for Sompa and Father
  const multivitamin = await prisma.medication.create({
    data: {
      familyProfileId: selfProfile.id,
      name: 'Multivitamin Formula A',
      dosage: '1 tablet',
      frequency: 'DAILY',
      scheduleTimes: '08:00',
      instructions: 'Take in morning with water after breakfast',
      startDate: '2026-06-01',
      active: true,
    },
  });

  const bpMedicine = await prisma.medication.create({
    data: {
      familyProfileId: fatherProfile.id,
      name: 'Amlodipine',
      dosage: '5mg',
      frequency: 'DAILY',
      scheduleTimes: '09:00',
      instructions: 'Take with or without food in morning',
      startDate: '2026-05-10',
      active: true,
    },
  });

  // 7. Seed 30 Days of History (June 6 to July 6, 2026)
  const now = new Date('2026-07-06T12:00:00Z');
  const baseWeight = 74.5;
  for (let i = 30; i >= 0; i--) {
    const currentDate = new Date(now);
    currentDate.setDate(now.getDate() - i);
    const dateStr = currentDate.toISOString().split('T')[0];

    // Day of week (0 is Sunday, 6 is Saturday)
    const dayOfWeek = currentDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Weight entry: gradual downward trend
    // 74.5 kg -> 71.8 kg
    const weightLossRatio = (30 - i) / 30;
    const currentWeight = baseWeight - weightLossRatio * 2.7 + (Math.random() * 0.4 - 0.2);

    await prisma.weightEntry.create({
      data: {
        familyProfileId: selfProfile.id,
        weight: parseFloat(currentWeight.toFixed(1)),
        date: dateStr,
        timestamp: new Date(`${dateStr}T07:00:00Z`),
        notes: i === 30 ? 'Starting weight tracking' : null,
      },
    });

    // Sleep entry: weekend variance
    const sleepHour = isWeekend ? 23 : 22; // bedtime: 11 PM or 10 PM
    const sleepMin = Math.floor(Math.random() * 60);
    const wakeHour = isWeekend ? 8 : 6; // wake: 8 AM or 6 AM
    const wakeMin = Math.floor(Math.random() * 60);

    const bedtime = new Date(`${dateStr}T${sleepHour.toString().padStart(2, '0')}:${sleepMin.toString().padStart(2, '0')}:00Z`);
    // Adjust day for bedtime if it falls before midnight
    bedtime.setDate(bedtime.getDate() - 1);

    const wakeTime = new Date(`${dateStr}T${wakeHour.toString().padStart(2, '0')}:${wakeMin.toString().padStart(2, '0')}:00Z`);
    const durationMinutes = Math.floor((wakeTime.getTime() - bedtime.getTime()) / 60000);

    await prisma.sleepEntry.create({
      data: {
        familyProfileId: selfProfile.id,
        date: dateStr,
        bedtime,
        wakeTime,
        durationMinutes,
        qualityRating: isWeekend ? 4 + Math.floor(Math.random() * 2) : 3 + Math.floor(Math.random() * 3), // 3 to 5
        interruptions: Math.random() > 0.7 ? 'Woke up once' : 'None',
      },
    });

    // Hydration entries: 1.5L to 2.8L
    const drinkTimes = ['08:30', '11:00', '13:30', '16:00', '19:30', '21:00'];
    const totalDoses = isWeekend ? 4 : 6;

    for (let j = 0; j < totalDoses; j++) {
      const time = drinkTimes[j];
      const amount = j === 2 ? 500 : 250 + Math.floor(Math.random() * 3) * 50; // 250, 300, 350 or 500 ml
      await prisma.waterEntry.create({
        data: {
          familyProfileId: selfProfile.id,
          amount,
          beverageType: 'Water',
          timestamp: new Date(`${dateStr}T${time}:00Z`),
        },
      });
    }

    // Nutrition Meal Entries
    // We vary weekend calories higher
    // Breakfast: 8:00 AM
    await prisma.mealEntry.create({
      data: {
        familyProfileId: selfProfile.id,
        foodName: 'Oats with Almond Milk & Banana',
        quantity: 1,
        unit: 'serving',
        mealType: 'BREAKFAST',
        calories: 380,
        protein: 10,
        carbs: 65,
        fats: 8,
        fiber: 9,
        sugar: 18,
        sodium: 120,
        timestamp: new Date(`${dateStr}T08:15:00Z`),
      },
    });

    // Lunch: 13:00
    await prisma.mealEntry.create({
      data: {
        familyProfileId: selfProfile.id,
        foodName: 'Roti with Dal & Mixed Veg Sabzi',
        quantity: 1,
        unit: 'serving',
        mealType: 'LUNCH',
        calories: 550,
        protein: 22,
        carbs: 85,
        fats: 14,
        fiber: 12,
        sugar: 4,
        sodium: 480,
        timestamp: new Date(`${dateStr}T13:05:00Z`),
      },
    });

    // Dinner: 20:00
    await prisma.mealEntry.create({
      data: {
        familyProfileId: selfProfile.id,
        foodName: 'Paneer Rice Bowl with Curd',
        quantity: 1,
        unit: 'serving',
        mealType: 'DINNER',
        calories: 620,
        protein: 28,
        carbs: 75,
        fats: 22,
        fiber: 6,
        sugar: 5,
        sodium: 510,
        timestamp: new Date(`${dateStr}T20:10:00Z`),
      },
    });

    // Snack (optional)
    if (Math.random() > 0.4 || isWeekend) {
      await prisma.mealEntry.create({
        data: {
          familyProfileId: selfProfile.id,
          foodName: isWeekend ? 'Veg Samosa & Curd Dahi' : 'Apple with Peanut Butter alternative (Sunbutter)',
          quantity: 1,
          unit: 'serving',
          mealType: 'SNACK',
          calories: isWeekend ? 320 : 180,
          protein: isWeekend ? 6 : 8,
          carbs: isWeekend ? 40 : 25,
          fats: isWeekend ? 15 : 10,
          fiber: isWeekend ? 2 : 4,
          sugar: isWeekend ? 6 : 14,
          sodium: isWeekend ? 350 : 90,
          timestamp: new Date(`${dateStr}T17:30:00Z`),
        },
      });
    }

    // Workout entry: running or strength or yoga (3-4 times a week)
    if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5 || dayOfWeek === 6) {
      const type = dayOfWeek === 1 ? 'RUNNING' : dayOfWeek === 3 ? 'STRENGTH' : dayOfWeek === 5 ? 'YOGA' : 'WALKING';
      const duration = dayOfWeek === 1 ? 30 : dayOfWeek === 3 ? 45 : dayOfWeek === 5 ? 40 : 60;
      const distance = dayOfWeek === 1 ? 4.5 : dayOfWeek === 6 ? 5.2 : null;
      const steps = dayOfWeek === 1 ? 6000 : dayOfWeek === 6 ? 7500 : 2000;

      await prisma.workoutEntry.create({
        data: {
          familyProfileId: selfProfile.id,
          type,
          durationMinutes: duration,
          distance,
          steps,
          date: dateStr,
          timestamp: new Date(`${dateStr}T18:30:00Z`),
          notes: type === 'RUNNING' ? 'Nice steady pace' : type === 'YOGA' ? 'Felt good and stretched' : null,
        },
      });
    }

    // Medication Event logs for Sompa (Multivitamin at 8:00 AM)
    const isTaken = Math.random() > 0.08; // 92% adherence
    await prisma.medicationEvent.create({
      data: {
        familyProfileId: selfProfile.id,
        medicationId: multivitamin.id,
        scheduledTime: new Date(`${dateStr}T08:00:00Z`),
        status: isTaken ? 'TAKEN' : 'MISSED',
        timestamp: isTaken ? new Date(`${dateStr}T08:15:00Z`) : null,
      },
    });

    // Father Medication events (BP pill)
    const fatherBpTaken = Math.random() > 0.05;
    await prisma.medicationEvent.create({
      data: {
        familyProfileId: fatherProfile.id,
        medicationId: bpMedicine.id,
        scheduledTime: new Date(`${dateStr}T09:00:00Z`),
        status: fatherBpTaken ? 'TAKEN' : 'MISSED',
        timestamp: fatherBpTaken ? new Date(`${dateStr}T09:05:00Z`) : null,
      },
    });
  }

  // 8. Past and Upcoming Appointments & Documents
  // Past cardiology visit
  const pastApptDate = new Date(now);
  pastApptDate.setDate(now.getDate() - 15);
  const pastApptDateStr = pastApptDate.toISOString().split('T')[0];

  const pastAppt = await prisma.appointment.create({
    data: {
      familyProfileId: selfProfile.id,
      doctorId: drSharma.id,
      date: pastApptDateStr,
      time: '11:30',
      isVirtual: false,
      status: 'COMPLETED',
      reason: 'Routine cardiology follow-up for mild blood pressure checks',
      notes: 'Blood pressure is stable at 122/81. Advised to continue moderate exercise and monitor hydration and sodium levels.',
      preparationList: 'Carry current prescription, Carry home BP log, Attach recent lab reports',
      followUpDate: '2026-07-11',
    },
  });

  // Seed Medical Record for past appointment
  await prisma.medicalRecord.create({
    data: {
      familyProfileId: selfProfile.id,
      appointmentId: pastAppt.id,
      title: 'Cardiology Consultation Summary',
      category: 'PRESCRIPTION',
      provider: 'Dr. Sharma / City Care Clinic',
      date: pastApptDateStr,
      fileUrl: '/records/cardiology_consult_june2026.pdf',
      tags: 'Cardiology, BP, Consultation',
    },
  });

  await prisma.medicalRecord.create({
    data: {
      familyProfileId: selfProfile.id,
      title: 'Lipid Profile Blood Report',
      category: 'LAB_REPORT',
      provider: 'Apex Diagnostics',
      date: pastApptDateStr,
      fileUrl: '/records/lipid_profile_june2026.pdf',
      tags: 'Lab Report, Cholesterol',
    },
  });

  // Upcoming appointment (in 5 days: July 11)
  const upcomingApptDate = new Date(now);
  upcomingApptDate.setDate(now.getDate() + 5);
  const upcomingApptDateStr = upcomingApptDate.toISOString().split('T')[0];

  await prisma.appointment.create({
    data: {
      familyProfileId: selfProfile.id,
      doctorId: drSharma.id,
      date: upcomingApptDateStr,
      time: '11:30',
      isVirtual: false,
      status: 'CONFIRMED',
      reason: 'Follow-up cardiology consultation',
      notes: 'Check progress on weight target and hydration.',
      preparationList: 'Carry current prescription, Attach recent BP readings, Prepare questions',
    },
  });

  // Sarah Pediatrician Past Appt
  const pediatricApptDate = new Date(now);
  pediatricApptDate.setDate(now.getDate() - 10);
  const pediatricApptDateStr = pediatricApptDate.toISOString().split('T')[0];

  const daughterAppt = await prisma.appointment.create({
    data: {
      familyProfileId: daughterProfile.id,
      doctorId: drAnjali.id,
      date: pediatricApptDateStr,
      time: '10:00',
      isVirtual: false,
      status: 'COMPLETED',
      reason: 'Regular child growth and immunizations check',
      notes: 'Immunizations up to date. Growth tracking normal (55th percentile). Recommend monitoring peanut sensitivity.',
      preparationList: 'Carry immunization card',
    },
  });

  await prisma.medicalRecord.create({
    data: {
      familyProfileId: daughterProfile.id,
      appointmentId: daughterAppt.id,
      title: 'Immunization Record',
      category: 'VACCINATION',
      provider: 'Dr. Anjali / Kids First Clinic',
      date: pediatricApptDateStr,
      fileUrl: '/records/sarah_immunization_2026.pdf',
      tags: 'Vaccination, Pediatric',
    },
  });

  // 9. Connected Timeline Events
  // Seed symptom, appointment, record, medication start sequence
  const dayMinus18 = new Date(now);
  dayMinus18.setDate(now.getDate() - 18);
  await prisma.timelineEvent.create({
    data: {
      familyProfileId: selfProfile.id,
      eventType: 'SYMPTOM',
      title: 'Mild chest tightness logged',
      description: 'Felt slight tightness during high-intensity jogging. Disappeared in 5 minutes after resting.',
      timestamp: dayMinus18,
    },
  });

  const dayMinus15 = new Date(now);
  dayMinus15.setDate(now.getDate() - 15);
  await prisma.timelineEvent.create({
    data: {
      familyProfileId: selfProfile.id,
      eventType: 'APPOINTMENT',
      eventId: pastAppt.id,
      title: 'Cardiology Consultation',
      description: 'Completed consultation with Dr. Sharma. Blood pressure stable at 122/81. Multivitamins checked.',
      timestamp: dayMinus15,
    },
  });

  const dayMinus14 = new Date(now);
  dayMinus14.setDate(now.getDate() - 14);
  await prisma.timelineEvent.create({
    data: {
      familyProfileId: selfProfile.id,
      eventType: 'PRESCRIPTION',
      eventId: pastAppt.id,
      title: 'Prescription uploaded',
      description: 'Uploaded "Cardiology Consultation Summary" PDF from City Care Clinic.',
      timestamp: dayMinus14,
    },
  });

  const dayMinus13 = new Date(now);
  dayMinus13.setDate(now.getDate() - 13);
  await prisma.timelineEvent.create({
    data: {
      familyProfileId: selfProfile.id,
      eventType: 'MEDICATION_CHANGE',
      title: 'Multivitamin Schedule Started',
      description: 'Scheduled "Multivitamin Formula A" (1 tablet daily at 08:00 AM).',
      timestamp: dayMinus13,
    },
  });

  // 10. Care Circle Members
  await prisma.careCircleMember.create({
    data: {
      userId: user.id,
      familyProfileId: selfProfile.id,
      email: 'caregiver@wellsync.com',
      relationshipLabel: 'Trusted caregiver',
      role: 'CAREGIVER',
      permissions: JSON.stringify({
        appointments: 'read',
        medications: 'write',
        vitals: 'read',
        nutrition: 'read',
      }),
      active: true,
    },
  });

  await prisma.careCircleMember.create({
    data: {
      userId: user.id,
      familyProfileId: selfProfile.id,
      email: 'sharma@citycare.com',
      relationshipLabel: 'Clinician viewer',
      role: 'CLINICIAN_VIEWER',
      permissions: JSON.stringify({
        appointments: 'read',
        medications: 'read',
        vitals: 'read',
        records: 'read',
      }),
      active: true,
    },
  });

  // 11. Emergency Profile for Sompa
  const emergencyToken = 'tok_sompa_secure_emergency_access_key_xyz_789';
  await prisma.emergencyProfile.create({
    data: {
      familyProfileId: selfProfile.id,
      bloodType: 'O+',
      allergies: 'Peanuts, Penicillin (severe)',
      criticalConditions: 'Mild chronic blood pressure variance',
      currentMedications: 'None daily (except over-the-counter Multivitamins)',
      emergencyNote: 'Carries peanut allergen auto-injector (EpiPen) in backpack.',
      publicFields: JSON.stringify(['preferredName', 'bloodType', 'allergies', 'criticalConditions', 'currentMedications', 'primaryDoctor', 'insuranceNote', 'emergencyNote']),
      token: emergencyToken,
      active: true,
    },
  });

  // 12. Notifications
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: 'Upcoming Cardiology Appointment',
      message: 'Reminder: Appointment with Dr. Sharma on July 11 at 11:30 AM.',
      category: 'APPOINTMENT',
      notificationType: 'APPOINTMENT',
      isRead: false,
    },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      title: 'Medication Refill Warning',
      message: 'Multivitamin Formula A schedule has run for 30 days. Plan refill soon.',
      category: 'MEDICATION',
      notificationType: 'MEDICATION',
      isRead: true,
    },
  });

  // 13. Audit Log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'INITIAL_SEED',
      target: 'Database populated',
    },
  });

  console.log('Database seeding successfully finished!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
