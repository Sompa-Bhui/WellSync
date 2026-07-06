import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser, getActiveProfile } from '@/src/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeProfile = await getActiveProfile(user.id);
    const url = new URL(req.url);
    const dateStr = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

    const meals = await prisma.mealEntry.findMany({
      where: {
        familyProfileId: activeProfile.id,
        timestamp: {
          gte: new Date(`${dateStr}T00:00:00Z`),
          lte: new Date(`${dateStr}T23:59:59Z`),
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    return NextResponse.json(meals);
  } catch (error) {
    console.error('Meals GET error:', error);
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

    const activeProfile = await getActiveProfile(user.id);
    const body = await req.json();

    const {
      foodName,
      quantity,
      unit,
      mealType,
      calories,
      protein,
      carbs,
      fats,
      fiber = 0,
      sugar = 0,
      sodium = 0,
      timestamp,
    } = body;

    if (!foodName || !quantity || !unit || !mealType) {
      return NextResponse.json(
        { error: 'Required fields: foodName, quantity, unit, mealType' },
        { status: 400 }
      );
    }

    // 1. Allergy & Restriction Check
    const activeAllergies = activeProfile.allergies
      ? activeProfile.allergies.split(',').map((s) => s.trim().toLowerCase())
      : [];
    const activeRestrictions = activeProfile.foodRestrictions
      ? activeProfile.foodRestrictions.split(',').map((s) => s.trim().toLowerCase())
      : [];

    let allergenAlert = null;
    let restrictionAlert = null;

    const lowerFood = foodName.toLowerCase();

    // Check allergies
    for (const allergy of activeAllergies) {
      if (allergy && lowerFood.includes(allergy)) {
        allergenAlert = `Warning: This food contains "${allergy}" which matches a confirmed allergy on this profile!`;
        break;
      }
    }

    // Check restrictions
    for (const restriction of activeRestrictions) {
      if (restriction && lowerFood.includes(restriction)) {
        restrictionAlert = `Alert: This food conflicts with your configured preference restriction: "${restriction}".`;
        break;
      }
    }

    // 2. Create Meal Entry
    const meal = await prisma.mealEntry.create({
      data: {
        familyProfileId: activeProfile.id,
        foodName,
        quantity: parseFloat(quantity),
        unit,
        mealType,
        calories: parseFloat(calories || 0),
        protein: parseFloat(protein || 0),
        carbs: parseFloat(carbs || 0),
        fats: parseFloat(fats || 0),
        fiber: parseFloat(fiber || 0),
        sugar: parseFloat(sugar || 0),
        sodium: parseFloat(sodium || 0),
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      },
    });

    // Write timeline event if allergy flag occurred
    if (allergenAlert) {
      await prisma.timelineEvent.create({
        data: {
          familyProfileId: activeProfile.id,
          eventType: 'VITAL_ALERT',
          title: 'Allergen Violation Logged',
          description: `Logged consumption of "${foodName}" containing allergen: ${allergenAlert}`,
        },
      });
    }

    return NextResponse.json({
      meal,
      warning: allergenAlert || restrictionAlert,
    });
  } catch (error) {
    console.error('Meals POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred' },
      { status: 500 }
    );
  }
}
