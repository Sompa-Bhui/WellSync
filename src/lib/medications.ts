import { prisma } from './db';
import { getActiveProfile } from './auth';

export const MEDICATION_STATUSES = ['PENDING', 'TAKEN', 'SKIPPED', 'MISSED'] as const;
export const MEDICATION_FREQUENCIES = ['DAILY', 'TWICE_DAILY', 'THREE_TIMES_DAILY', 'WEEKLY', 'AS_NEEDED', 'CUSTOM'] as const;

export type MedicationStatus = (typeof MEDICATION_STATUSES)[number];

export function parseScheduleTimes(scheduleTimes: string) {
  return scheduleTimes
    .split(',')
    .map((time) => time.trim())
    .filter(Boolean);
}

export function medicationSummary(events: { status: string }[]) {
  return {
    pending: events.filter((event) => event.status === 'PENDING').length,
    taken: events.filter((event) => event.status === 'TAKEN').length,
    skipped: events.filter((event) => event.status === 'SKIPPED').length,
    missed: events.filter((event) => event.status === 'MISSED').length,
  };
}

export async function ensureMedicationOwnership(userId: string, medicationId: string) {
  const activeProfile = await getActiveProfile(userId);
  return prisma.medication.findFirst({
    where: { id: medicationId, familyProfileId: activeProfile.id },
  });
}

export function buildScheduledEvents(medication: {
  id: string;
  familyProfileId: string;
  scheduleTimes: string;
  startDate: string;
  endDate?: string | null;
}) {
  const times = parseScheduleTimes(medication.scheduleTimes);
  const start = new Date(`${medication.startDate}T00:00:00.000Z`);
  const endDate = medication.endDate ? new Date(`${medication.endDate}T23:59:59.999Z`) : new Date();
  const generated: { scheduledTime: Date; medicationId: string; familyProfileId: string; status: MedicationStatus }[] = [];
  const current = new Date(start);

  while (current <= endDate) {
    const date = current.toISOString().slice(0, 10);
    for (const time of times) {
      generated.push({
        medicationId: medication.id,
        familyProfileId: medication.familyProfileId,
        scheduledTime: new Date(`${date}T${time}:00.000Z`),
        status: 'PENDING',
      });
    }
    current.setDate(current.getDate() + 1);
  }

  return generated;
}

export async function ensureTodayMedicationEvents(userId: string) {
  const activeProfile = await getActiveProfile(userId);
  const today = new Date().toISOString().slice(0, 10);
  const medications = await prisma.medication.findMany({
    where: { familyProfileId: activeProfile.id, active: true, startDate: { lte: today } },
  });

  for (const medication of medications) {
    const scheduleTimes = parseScheduleTimes(medication.scheduleTimes);
    const withinRange = !medication.endDate || medication.endDate >= today;
    if (!withinRange) continue;

    for (const time of scheduleTimes) {
      const scheduledTime = new Date(`${today}T${time}:00.000Z`);
      const existing = await prisma.medicationEvent.findFirst({
        where: {
          familyProfileId: activeProfile.id,
          medicationId: medication.id,
          scheduledTime,
        },
      });

      if (!existing) {
        await prisma.medicationEvent.create({
          data: {
            familyProfileId: activeProfile.id,
            medicationId: medication.id,
            scheduledTime,
            status: 'PENDING',
          },
        });
      }
    }
  }
}
