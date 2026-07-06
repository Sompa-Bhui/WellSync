import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getActiveProfile, getSessionUser } from '@/src/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const activeProfile = await getActiveProfile(user.id);
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get('limit') || '30');

    const entries = await prisma.workoutEntry.findMany({
      where: { familyProfileId: activeProfile.id },
      orderBy: [{ date: 'desc' }, { timestamp: 'desc' }],
      take: limit,
    });

    return NextResponse.json(entries.reverse());
  } catch (error) {
    console.error('Activity GET error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const activeProfile = await getActiveProfile(user.id);
    const body = await req.json();
    const { type, durationMinutes, distance, steps, notes, date, timestamp } = body;

    if (!type || !durationMinutes || !date) {
      return NextResponse.json({ error: 'Type, durationMinutes, and date are required' }, { status: 400 });
    }

    const entry = await prisma.workoutEntry.create({
      data: {
        familyProfileId: activeProfile.id,
        type,
        durationMinutes: Number(durationMinutes),
        distance: distance ? Number(distance) : null,
        steps: steps ? Number(steps) : null,
        notes: notes || null,
        date,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Activity POST error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
