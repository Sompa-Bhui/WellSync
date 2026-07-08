import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser } from '@/src/lib/auth';
import { canUsePermission, resolveActiveProfileAccess } from '@/src/lib/authorization';
import { computeNextTriggerAt, ensureReminderOwnership, parseReminderRecurrence } from '@/src/lib/reminders';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await ctx.params;
    const access = await resolveActiveProfileAccess(user.id);
    if (!canUsePermission(access, 'dashboard.summary.view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const reminder = await ensureReminderOwnership(user.id, id);
    if (!reminder) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(reminder);
  } catch (error) {
    console.error('Reminder GET error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await ctx.params;
    const access = await resolveActiveProfileAccess(user.id);
    if (!access || access.accessType !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const existing = await ensureReminderOwnership(user.id, id);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const scheduledAt = body.scheduledAt ? new Date(String(body.scheduledAt)) : existing.scheduledAt;
    const recurrence = typeof body.recurrence === 'string' ? parseReminderRecurrence(body.recurrence) : parseReminderRecurrence(existing.recurrence);
    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        reminderType: body.reminderType ? String(body.reminderType) : existing.reminderType,
        title: body.title ? String(body.title) : existing.title,
        description: body.description ? String(body.description) : existing.description,
        scheduledAt,
        timezone: body.timezone ? String(body.timezone) : existing.timezone,
        recurrence: typeof body.recurrence === 'string' ? body.recurrence : existing.recurrence,
        enabled: typeof body.enabled === 'boolean' ? body.enabled : existing.enabled,
        sourceType: body.sourceType ? String(body.sourceType) : existing.sourceType,
        sourceId: body.sourceId ? String(body.sourceId) : existing.sourceId,
        nextTriggerAt: typeof body.enabled === 'boolean' && !body.enabled ? null : computeNextTriggerAt(new Date(), scheduledAt, recurrence),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Reminder PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await ctx.params;
    const access = await resolveActiveProfileAccess(user.id);
    if (!access || access.accessType !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const existing = await ensureReminderOwnership(user.id, id);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.reminder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reminder DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
