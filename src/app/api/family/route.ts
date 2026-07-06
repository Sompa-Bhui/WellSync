import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser } from '@/src/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const familyProfiles = await prisma.familyProfile.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(familyProfiles);
  } catch (error) {
    console.error('Family GET error:', error);
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

    const { name, relationship, allergies, foodRestrictions, dietaryPreference } = await req.json();

    if (!name || !relationship) {
      return NextResponse.json(
        { error: 'Name and relationship are required' },
        { status: 400 }
      );
    }

    const profile = await prisma.familyProfile.create({
      data: {
        userId: user.id,
        name,
        relationship,
        allergies,
        foodRestrictions,
        dietaryPreference,
      },
    });

    // Add Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_FAMILY_PROFILE',
        target: `FamilyProfile ID: ${profile.id} (${name})`,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Family POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred' },
      { status: 500 }
    );
  }
}
