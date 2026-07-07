import { prisma } from './db';
import { getActiveProfile } from './auth';

export const APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'MISSED'] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export function parseListField(value: string | null | undefined) {
  if (!value) return [] as string[];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    // Fallback to comma-separated strings.
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function serializeListField(items: unknown) {
  if (!Array.isArray(items)) return null;
  return JSON.stringify(items.map((item) => String(item).trim()).filter(Boolean));
}

export function getAppointmentDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00.000Z`);
}

export async function ensureAppointmentOwnership(userId: string, appointmentId: string) {
  const activeProfile = await getActiveProfile(userId);
  return prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      familyProfileId: activeProfile.id,
    },
    include: {
      doctor: true,
      medicalRecords: true,
    },
  });
}

export async function createAppointmentTimelineEvent(params: {
  familyProfileId: string;
  eventId?: string | null;
  title: string;
  description: string;
}) {
  return prisma.timelineEvent.create({
    data: {
      familyProfileId: params.familyProfileId,
      eventType: 'APPOINTMENT',
      eventId: params.eventId || null,
      title: params.title,
      description: params.description,
    },
  });
}

export async function createFollowUpTimelineEvent(params: {
  familyProfileId: string;
  eventId?: string | null;
  title: string;
  description: string;
}) {
  return prisma.timelineEvent.create({
    data: {
      familyProfileId: params.familyProfileId,
      eventType: 'FOLLOW_UP',
      eventId: params.eventId || null,
      title: params.title,
      description: params.description,
    },
  });
}
