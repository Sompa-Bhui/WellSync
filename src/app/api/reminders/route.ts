import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getActiveProfile, getSessionUser } from '@/src/lib/auth';
import { canUsePermission, resolveActiveProfileAccess } from '@/src/lib/authorization';
import { computeNextTriggerAt, parseReminderRecurrence, processDueReminders } from '@/src/lib/reminders';

function isValidDateTime(value: unknown) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await resolveActiveProfileAccess(user.id);
    if (!canUsePermission(access, 'dashboard.summary.view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const activeProfile = await getActiveProfile(user.id);
    const reminders = await prisma.reminder.findMany({
      where: { familyProfileId: activeProfile.id },
      orderBy: [{ enabled: 'desc' }, { nextTriggerAt: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error('Reminders GET error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await resolveActiveProfileAccess(user.id);
    if (!access || access.accessType !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const activeProfile = await getActiveProfile(user.id);
    const body = await req.json();
    if (!body.title || !isValidDateTime(body.scheduledAt)) {
      return NextResponse.json({ error: 'title and scheduledAt are required' }, { status: 400 });
    }

    const scheduledAt = new Date(String(body.scheduledAt));
    const recurrence = parseReminderRecurrence(typeof body.recurrence === 'string' ? body.recurrence : null);
    const reminder = await prisma.reminder.create({
      data: {
        familyProfileId: activeProfile.id,
        createdByUserId: user.id,
        reminderType: typeof body.reminderType === 'string' ? body.reminderType : 'CUSTOM',
        title: String(body.title),
        description: body.description ? String(body.description) : null,
        scheduledAt,
        timezone: body.timezone ? String(body.timezone) : 'UTC',
        recurrence: typeof body.recurrence === 'string' ? body.recurrence : null,
        enabled: body.enabled === false ? false : true,
        sourceType: typeof body.sourceType === 'string' ? String(body.sourceType) : 'CUSTOM',
        sourceId: body.sourceId ? String(body.sourceId) : null,
        nextTriggerAt: body.enabled === false ? null : computeNextTriggerAt(new Date(), scheduledAt, recurrence),
      },
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error('Reminders POST error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}

export async function PUT() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const access = await resolveActiveProfileAccess(user.id);
    if (!canUsePermission(access, 'dashboard.summary.view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const processed = await processDueReminders();
    return NextResponse.json({ processed });
  } catch (error) {
    console.error('Reminders process error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
