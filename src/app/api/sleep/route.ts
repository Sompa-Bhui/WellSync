import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser, getActiveProfile } from '@/src/lib/auth';
import { formatMinutes } from '@/src/lib/date';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeProfile = await getActiveProfile(user.id);
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '7');

    const entries = await prisma.sleepEntry.findMany({
      where: { familyProfileId: activeProfile.id },
      orderBy: { date: 'desc' },
      take: limit,
    });

    const normalized = entries
      .reverse()
      .map((entry) => ({
        ...entry,
        duration: formatMinutes(entry.durationMinutes),
      }));

    return NextResponse.json(normalized);
  } catch (error) {
    console.error('Sleep GET error:', error);
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
    const { date, bedtime, wakeTime, qualityRating, interruptions } = await req.json();

    if (!date || !bedtime || !wakeTime) {
      return NextResponse.json(
        { error: 'Required fields: date, bedtime, wakeTime' },
        { status: 400 }
      );
    }

    const bedDate = new Date(bedtime);
    const wakeDate = new Date(wakeTime);
    const durationMinutes = Math.floor((wakeDate.getTime() - bedDate.getTime()) / 60000);

    const sleepEntry = await prisma.sleepEntry.upsert({
      where: {
        familyProfileId_date: {
          familyProfileId: activeProfile.id,
          date,
        },
      },
      update: {
        bedtime: bedDate,
        wakeTime: wakeDate,
        durationMinutes,
        qualityRating: qualityRating ? parseInt(qualityRating) : null,
        interruptions,
      },
      create: {
        familyProfileId: activeProfile.id,
        date,
        bedtime: bedDate,
        wakeTime: wakeDate,
        durationMinutes,
        qualityRating: qualityRating ? parseInt(qualityRating) : null,
        interruptions,
      },
    });

    return NextResponse.json({
      ...sleepEntry,
      duration: formatMinutes(sleepEntry.durationMinutes),
    });
  } catch (error) {
    console.error('Sleep POST error:', error);
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

    const entry = await prisma.sleepEntry.findFirst({
      where: { id, familyProfileId: activeProfile.id },
    });

    if (!entry) {
      return NextResponse.json({ error: 'Sleep entry not found' }, { status: 404 });
    }

    await prisma.sleepEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sleep DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
