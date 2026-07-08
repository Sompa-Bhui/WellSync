import { prisma } from './db';
import { getActiveProfile } from './auth';
const db = prisma;

export type ReminderRecurrence =
  | { type: 'NONE' }
  | { type: 'DAILY'; intervalDays?: number }
  | { type: 'WEEKLY'; daysOfWeek?: number[]; intervalWeeks?: number };

export type ReminderSourceType = 'CUSTOM' | 'MEDICATION' | 'APPOINTMENT' | 'FOLLOW_UP' | 'HYDRATION';

export function parseReminderRecurrence(value: string | null | undefined): ReminderRecurrence {
  if (!value) return { type: 'NONE' };
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return { type: 'NONE' };
    const type = String((parsed as { type?: string }).type || 'NONE').toUpperCase();
    if (type === 'DAILY') {
      const intervalDays = Number((parsed as { intervalDays?: number }).intervalDays || 1);
      return { type: 'DAILY', intervalDays: Number.isFinite(intervalDays) && intervalDays > 0 ? intervalDays : 1 };
    }
    if (type === 'WEEKLY') {
      const daysOfWeek = Array.isArray((parsed as { daysOfWeek?: unknown[] }).daysOfWeek)
        ? (parsed as { daysOfWeek?: unknown[] }).daysOfWeek!.map((day) => Number(day)).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
        : undefined;
      const intervalWeeks = Number((parsed as { intervalWeeks?: number }).intervalWeeks || 1);
      return {
        type: 'WEEKLY',
        daysOfWeek: daysOfWeek && daysOfWeek.length > 0 ? daysOfWeek : undefined,
        intervalWeeks: Number.isFinite(intervalWeeks) && intervalWeeks > 0 ? intervalWeeks : 1,
      };
    }
  } catch {
    return { type: 'NONE' };
  }
  return { type: 'NONE' };
}

export function computeNextTriggerAt(now: Date, scheduledAt: Date, recurrence: ReminderRecurrence) {
  if (recurrence.type === 'DAILY') {
    const intervalDays = recurrence.intervalDays ?? 1;
    const next = new Date(scheduledAt);
    while (next <= now) {
      next.setDate(next.getDate() + intervalDays);
    }
    return next;
  }
  if (recurrence.type === 'WEEKLY') {
    const next = new Date(scheduledAt);
    const targetDays = recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0 ? recurrence.daysOfWeek : [scheduledAt.getUTCDay()];
    const intervalWeeks = recurrence.intervalWeeks ?? 1;
    while (next <= now) {
      next.setDate(next.getDate() + 1);
      if (!targetDays.includes(next.getUTCDay())) continue;
      const weekDiff = Math.floor((next.getTime() - scheduledAt.getTime()) / (7 * 24 * 60 * 60 * 1000));
      if (weekDiff % intervalWeeks === 0) break;
    }
    return next;
  }
  return scheduledAt;
}

export function buildDedupKey(reminderId: string, triggerAt: Date) {
  return `reminder:${reminderId}:${triggerAt.toISOString()}`;
}

export function reminderTitleForSource(sourceType: ReminderSourceType, title: string) {
  return `${sourceType.toLowerCase()}: ${title}`;
}

export async function processDueReminders(params?: { now?: Date; familyProfileId?: string }) {
  const now = params?.now ?? new Date();
  const reminders = await db.reminder.findMany({
    where: {
      enabled: true,
      ...(params?.familyProfileId ? { familyProfileId: params.familyProfileId } : {}),
    },
  });
  const dueReminders = reminders.filter((reminder: { nextTriggerAt?: Date | null; scheduledAt: Date }) => {
    const triggerAt = reminder.nextTriggerAt ?? reminder.scheduledAt;
    return new Date(triggerAt).getTime() <= now.getTime();
  });

  const processed: string[] = [];

  for (const reminder of dueReminders) {
    const triggerAt = reminder.nextTriggerAt ?? reminder.scheduledAt;
    const dedupKey = buildDedupKey(reminder.id, triggerAt);
    const notification = await db.notification.findUnique({ where: { dedupKey } });
    if (!notification) {
      const recipientProfile = await db.familyProfile.findUnique({
        where: { id: reminder.familyProfileId },
        select: { userId: true },
      });
      const recipientUserId = reminder.createdByUserId ?? recipientProfile?.userId;
      if (!recipientUserId) continue;
      await db.notification.create({
        data: {
          userId: recipientUserId,
          familyProfileId: reminder.familyProfileId,
          reminderId: reminder.id,
          title: reminder.title,
          message: reminder.description || reminder.title,
          category: 'REMINDER',
          notificationType: reminder.reminderType,
          sourceType: reminder.sourceType ?? undefined,
          sourceId: reminder.sourceId ?? undefined,
          dedupKey,
          isRead: false,
          timestamp: triggerAt,
          readAt: null,
        },
      });
    }

    const recurrence = parseReminderRecurrence(reminder.recurrence);
    const nextTriggerAt = computeNextTriggerAt(now, reminder.scheduledAt, recurrence);
    await db.reminder.update({
      where: { id: reminder.id },
      data: {
        lastTriggeredAt: triggerAt,
        nextTriggerAt: nextTriggerAt > triggerAt ? nextTriggerAt : null,
      },
    });
    processed.push(reminder.id);
  }

  return processed;
}

export async function ensureReminderOwnership(userId: string, reminderId: string) {
  const activeProfile = await getActiveProfile(userId);
  return db.reminder.findFirst({
    where: { id: reminderId, familyProfileId: activeProfile.id },
  });
}

export async function upsertSourceReminder(input: {
  familyProfileId: string;
  createdByUserId: string;
  sourceType: ReminderSourceType;
  sourceId: string;
  title: string;
  description?: string | null;
  scheduledAt: Date;
  timezone?: string;
  recurrence?: string | null;
  reminderType?: string;
  enabled?: boolean;
}) {
  const recurrence = parseReminderRecurrence(input.recurrence);
  const nextTriggerAt = input.enabled === false ? null : computeNextTriggerAt(new Date(), input.scheduledAt, recurrence);
  return db.reminder.upsert({
    where: { sourceType_sourceId: { sourceType: input.sourceType, sourceId: input.sourceId } },
    create: {
      familyProfileId: input.familyProfileId,
      createdByUserId: input.createdByUserId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      reminderType: input.reminderType || 'SYSTEM',
      title: input.title,
      description: input.description ?? null,
      scheduledAt: input.scheduledAt,
      timezone: input.timezone || 'UTC',
      recurrence: input.recurrence ?? null,
      enabled: input.enabled ?? true,
      nextTriggerAt,
    },
    update: {
      title: input.title,
      description: input.description ?? null,
      scheduledAt: input.scheduledAt,
      timezone: input.timezone || 'UTC',
      recurrence: input.recurrence ?? null,
      enabled: input.enabled ?? true,
      nextTriggerAt,
      reminderType: input.reminderType || 'SYSTEM',
    },
  });
}
