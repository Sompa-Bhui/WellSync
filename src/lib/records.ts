import { prisma } from './db';
import { getActiveProfile } from './auth';

export const RECORD_CATEGORIES = [
  'PRESCRIPTION',
  'LAB_REPORT',
  'IMAGING',
  'DISCHARGE_SUMMARY',
  'VACCINATION',
  'OTHER',
] as const;

export function parseTags(input: string | null | undefined) {
  if (!input) return [] as string[];
  return input
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function serializeTags(tags: unknown) {
  if (!Array.isArray(tags)) return null;
  return tags.map((tag) => String(tag).trim()).filter(Boolean).join(', ');
}

export async function ensureRecordOwnership(userId: string, recordId: string) {
  const activeProfile = await getActiveProfile(userId);
  return prisma.medicalRecord.findFirst({
    where: { id: recordId, familyProfileId: activeProfile.id },
    include: { appointment: { include: { doctor: true } } },
  });
}

export async function recordTimelineEvent(params: {
  familyProfileId: string;
  eventType: 'PRESCRIPTION' | 'LAB_REPORT' | 'IMAGING' | 'RECORD';
  eventId?: string | null;
  title: string;
  description: string;
}) {
  return prisma.timelineEvent.create({
    data: {
      familyProfileId: params.familyProfileId,
      eventType: params.eventType,
      eventId: params.eventId || null,
      title: params.title,
      description: params.description,
    },
  });
}
