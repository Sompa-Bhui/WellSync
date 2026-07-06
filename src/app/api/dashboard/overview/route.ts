import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser, getActiveProfile } from '@/src/lib/auth';
import type { MealEntry, WaterEntry, WorkoutEntry, MedicationEvent } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeProfile = await getActiveProfile(user.id);

    // Get current date string in user local timezone (simulated here as UTC or parameterized)
    const url = new URL(req.url);
    const dateStr = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

    // 1. Fetch Today's Nutrition (Meal entries)
    const meals = await prisma.mealEntry.findMany({
      where: {
        familyProfileId: activeProfile.id,
        timestamp: {
          gte: new Date(`${dateStr}T00:00:00Z`),
          lte: new Date(`${dateStr}T23:59:59Z`),
        },
      },
    });

    const nutritionSummary = meals.reduce(
      (acc, meal: MealEntry) => {
        acc.calories += meal.calories;
        acc.protein += meal.protein;
        acc.carbs += meal.carbs;
        acc.fats += meal.fats;
        acc.fiber += meal.fiber;
        acc.sugar += meal.sugar;
        acc.sodium += meal.sodium;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, sodium: 0 }
    );

    // 2. Fetch Today's Hydration (Water entries)
    const waterEntries = await prisma.waterEntry.findMany({
      where: {
        familyProfileId: activeProfile.id,
        timestamp: {
          gte: new Date(`${dateStr}T00:00:00Z`),
          lte: new Date(`${dateStr}T23:59:59Z`),
        },
      },
    });

    const totalWater = waterEntries.reduce((sum: number, entry: WaterEntry) => sum + entry.amount, 0);

    // 3. Fetch Sleep (for the dateStr)
    const sleep = await prisma.sleepEntry.findFirst({
      where: {
        familyProfileId: activeProfile.id,
        date: dateStr,
      },
    });

    // 4. Fetch Weight Trend (get last logged weight)
    const lastWeightEntry = await prisma.weightEntry.findFirst({
      where: { familyProfileId: activeProfile.id },
      orderBy: { timestamp: 'desc' },
    });

    // 5. Fetch Activity (Today's workouts)
    const workouts = await prisma.workoutEntry.findMany({
      where: {
        familyProfileId: activeProfile.id,
        date: dateStr,
      },
    });

    const totalSteps = workouts.reduce((sum: number, w: WorkoutEntry) => sum + (w.steps || 0), 0);
    const totalWorkoutDuration = workouts.reduce((sum: number, w: WorkoutEntry) => sum + w.durationMinutes, 0);

    // 6. Fetch Today's Medications Adherence
    const medicationEvents = await prisma.medicationEvent.findMany({
      where: {
        familyProfileId: activeProfile.id,
        scheduledTime: {
          gte: new Date(`${dateStr}T00:00:00Z`),
          lte: new Date(`${dateStr}T23:59:59Z`),
        },
      },
      include: {
        medication: true,
      },
    });

    const totalDoses = medicationEvents.length;
    const completedDoses = medicationEvents.filter((e: MedicationEvent) => e.status === 'TAKEN').length;

    // 7. Fetch Next Upcoming Appointment
    const nextAppointment = await prisma.appointment.findFirst({
      where: {
        familyProfileId: activeProfile.id,
        date: {
          gte: dateStr,
        },
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' },
      ],
      include: {
        doctor: true,
      },
    });

    // 8. Generate Alerts / Attention List (Explainable Insights)
    const alerts: string[] = [];
    const healthProfile = user.healthProfile;

    if (healthProfile) {
      // Hydration Check
      const hydrationGoal = 2200; // default 2.2L
      if (totalWater < hydrationGoal * 0.6) {
        alerts.push('Hydration is significantly below your typical daily threshold.');
      }

      // Medication Check
      const pendingDoses = medicationEvents.filter((e: MedicationEvent) => e.status === 'PENDING').length;
      if (pendingDoses > 0) {
        alerts.push(`You have ${pendingDoses} scheduled medication dose${pendingDoses > 1 ? 's' : ''} pending completion.`);
      }

      // Sleep Check
      if (sleep && sleep.durationMinutes < 360) {
        alerts.push('Logged sleep duration is below the minimum recommended target (6h).');
      }

      // Target Weight Check
      if (lastWeightEntry && healthProfile.targetWeight) {
        const diff = lastWeightEntry.weight - healthProfile.targetWeight;
        if (Math.abs(diff) < 0.5) {
          alerts.push('Congratulations! You are extremely close to your target weight.');
        }
      }
    }

    return NextResponse.json({
      date: dateStr,
      nutrition: {
        summary: nutritionSummary,
        targetCalories: 1850, // default target
        targetProtein: 90,
      },
      hydration: {
        total: totalWater,
        target: 2500, // in ml
      },
      sleep: sleep ? {
        durationHours: Math.floor(sleep.durationMinutes / 60),
        durationMinutes: sleep.durationMinutes % 60,
        targetHours: 8,
      } : null,
      vitals: {
        currentWeight: lastWeightEntry ? lastWeightEntry.weight : null,
        targetWeight: healthProfile?.targetWeight || null,
      },
      activity: {
        steps: totalSteps,
        targetSteps: 8000,
        workoutMinutes: totalWorkoutDuration,
      },
      medications: {
        completed: completedDoses,
        total: totalDoses,
        events: medicationEvents,
      },
      nextAppointment: nextAppointment ? {
        id: nextAppointment.id,
        doctorName: nextAppointment.doctor.name,
        specialty: nextAppointment.doctor.specialty,
        clinic: nextAppointment.doctor.clinic,
        date: nextAppointment.date,
        time: nextAppointment.time,
        status: nextAppointment.status,
      } : null,
      alerts,
    });
  } catch (error) {
    console.error('Dashboard overview GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred' },
      { status: 500 }
    );
  }
}
