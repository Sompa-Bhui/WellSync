import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser } from '@/src/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const healthProfile = await prisma.healthProfile.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json(healthProfile || {});
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      dateOfBirth,
      height,
      targetWeight,
      activityLevel,
      dietaryPreference,
      allergies,
      foodRestrictions,
      healthGoals,
      sleepWakeTime,
      sleepBedTime,
      preferredUnits,
      timezone,
    } = body;

    const healthProfile = await prisma.healthProfile.upsert({
      where: { userId: user.id },
      update: {
        dateOfBirth,
        height: height ? parseFloat(height) : null,
        targetWeight: targetWeight ? parseFloat(targetWeight) : null,
        activityLevel,
        dietaryPreference,
        allergies,
        foodRestrictions,
        healthGoals,
        sleepWakeTime,
        sleepBedTime,
        preferredUnits,
        timezone: timezone || 'UTC',
      },
      create: {
        userId: user.id,
        dateOfBirth,
        height: height ? parseFloat(height) : null,
        targetWeight: targetWeight ? parseFloat(targetWeight) : null,
        activityLevel,
        dietaryPreference,
        allergies,
        foodRestrictions,
        healthGoals,
        sleepWakeTime,
        sleepBedTime,
        preferredUnits,
        timezone: timezone || 'UTC',
      },
    });

    // Also update "SELF" family profile details to match dietary/allergies configurations for safety in isolation
    const selfProfile = await prisma.familyProfile.findFirst({
      where: { userId: user.id, relationship: 'SELF' },
    });

    if (selfProfile) {
      await prisma.familyProfile.update({
        where: { id: selfProfile.id },
        data: {
          allergies: allergies || selfProfile.allergies,
          foodRestrictions: foodRestrictions || selfProfile.foodRestrictions,
          dietaryPreference: dietaryPreference || selfProfile.dietaryPreference,
        },
      });
    }

    // Add Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE_PROFILE',
        target: `HealthProfile ID: ${healthProfile.id}`,
      },
    });

    return NextResponse.json(healthProfile);
  } catch (error) {
    console.error('Profile POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred' },
      { status: 500 }
    );
  }
}
