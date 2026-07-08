import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser, getActiveProfile } from '@/src/lib/auth';
import { resolveActiveProfileAccess, canUsePermission } from '@/src/lib/authorization';
import { upsertSourceReminder } from '@/src/lib/reminders';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeProfile = await getActiveProfile(user.id);
    const access = await resolveActiveProfileAccess(user.id);
    if (!canUsePermission(access, 'hydration.view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const url = new URL(req.url);
    const dateStr = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

    const entries = await prisma.waterEntry.findMany({
      where: {
        familyProfileId: activeProfile.id,
        timestamp: {
          gte: new Date(`${dateStr}T00:00:00Z`),
          lte: new Date(`${dateStr}T23:59:59Z`),
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error('Water GET error:', error);
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

    const access = await resolveActiveProfileAccess(user.id);
    if (!access || access.accessType !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const activeProfile = await getActiveProfile(user.id);
    const { amount, beverageType = 'Water', timestamp } = await req.json();

    if (!amount) {
      return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
    }

    const entry = await prisma.waterEntry.create({
      data: {
        familyProfileId: activeProfile.id,
        amount: parseFloat(amount),
        beverageType,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      },
    });

    if (entry.amount > 0) {
      const scheduledAt = new Date(entry.timestamp.getTime() + 60 * 60 * 1000);
      await upsertSourceReminder({
        familyProfileId: activeProfile.id,
        createdByUserId: user.id,
        sourceType: 'HYDRATION',
        sourceId: `hydration:${activeProfile.id}`,
        title: 'Hydration check-in',
        description: 'Log your next water intake when you are ready.',
        scheduledAt,
        recurrence: JSON.stringify({ type: 'DAILY', intervalDays: 1 }),
        reminderType: 'HYDRATION',
        enabled: true,
      });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Water POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error occurred' },
      { status: 500 }
    );
  }
}
