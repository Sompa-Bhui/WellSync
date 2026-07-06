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
    const limit = parseInt(url.searchParams.get('limit') || '30');

    const entries = await prisma.weightEntry.findMany({
      where: { familyProfileId: activeProfile.id },
      orderBy: { date: 'desc' },
      take: limit,
    });

    return NextResponse.json(entries.reverse());
  } catch (error) {
    console.error('Weight GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeProfile = await getActiveProfile(user.id);
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Entry id is required' }, { status: 400 });
    }

    const entry = await prisma.weightEntry.findFirst({
      where: { id, familyProfileId: activeProfile.id },
    });

    if (!entry) {
      return NextResponse.json({ error: 'Weight entry not found' }, { status: 404 });
    }

    await prisma.weightEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Weight DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeProfile = await getActiveProfile(user.id);
    const { weight, date, notes } = await req.json();

    if (!weight || !date) {
      return NextResponse.json(
        { error: 'Weight and date are required' },
        { status: 400 }
      );
    }

    const weightVal = parseFloat(weight);
    const dateStr = date;

    const entry = await prisma.weightEntry.upsert({
      where: {
        familyProfileId_date: {
          familyProfileId: activeProfile.id,
          date: dateStr,
        },
      },
      update: {
        weight: weightVal,
        notes,
        timestamp: new Date(`${dateStr}T12:00:00Z`),
      },
      create: {
        familyProfileId: activeProfile.id,
        weight: weightVal,
        date: dateStr,
        notes,
        timestamp: new Date(`${dateStr}T12:00:00Z`),
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Weight POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred' },
      { status: 500 }
    );
  }
}
