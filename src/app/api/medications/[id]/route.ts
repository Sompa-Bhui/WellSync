import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getActiveProfile, getSessionUser } from '@/src/lib/auth';
import { MEDICATION_FREQUENCIES, parseScheduleTimes } from '@/src/lib/medications';

function parseBool(value: unknown) {
  return value === true || value === 'true';
}

function validateMedicationPayload(body: Record<string, unknown>, partial = false) {
  const errors: string[] = [];
  if (!partial || body.name !== undefined) {
    if (!body.name || typeof body.name !== 'string') errors.push('name is required');
  }
  if (!partial || body.dosage !== undefined) {
    if (!body.dosage || typeof body.dosage !== 'string') errors.push('dosage is required');
  }
  if (!partial || body.unit !== undefined) {
    if (!body.unit || typeof body.unit !== 'string') errors.push('unit is required');
  }
  if (!partial || body.frequency !== undefined) {
    if (!body.frequency || typeof body.frequency !== 'string' || !MEDICATION_FREQUENCIES.includes(body.frequency as never)) errors.push('frequency is invalid');
  }
  if (!partial || body.scheduleTimes !== undefined) {
    if (!body.scheduleTimes || typeof body.scheduleTimes !== 'string' || parseScheduleTimes(body.scheduleTimes).length === 0) errors.push('scheduleTimes must include at least one time');
  }
  if (!partial || body.startDate !== undefined) {
    if (!body.startDate || typeof body.startDate !== 'string') errors.push('startDate is required');
  }
  return errors;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const activeProfile = await getActiveProfile(user.id);
    const medication = await prisma.medication.findFirst({
      where: { id, familyProfileId: activeProfile.id },
      include: {
        medicationEvents: { orderBy: { scheduledTime: 'desc' }, take: 50 },
      },
    });

    if (!medication) return NextResponse.json({ error: 'Medication not found' }, { status: 404 });
    return NextResponse.json(medication);
  } catch (error) {
    console.error('Medication detail error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const activeProfile = await getActiveProfile(user.id);
    const existing = await prisma.medication.findFirst({ where: { id, familyProfileId: activeProfile.id } });
    if (!existing) return NextResponse.json({ error: 'Medication not found' }, { status: 404 });

    const body = await req.json();
    const errors = validateMedicationPayload(body, true);
    if (errors.length > 0) return NextResponse.json({ error: errors.join(', ') }, { status: 400 });

    const updated = await prisma.medication.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        dosage: body.dosage ?? existing.dosage,
        unit: body.unit ? String(body.unit) : existing.unit,
        frequency: body.frequency ?? existing.frequency,
        scheduleTimes: body.scheduleTimes ?? existing.scheduleTimes,
        startDate: body.startDate ?? existing.startDate,
        endDate: body.endDate === '' ? null : body.endDate ?? existing.endDate,
        instructions: body.instructions === '' ? null : body.instructions ?? existing.instructions,
        refillDate: body.refillDate === '' ? null : body.refillDate ?? existing.refillDate,
        reminderEnabled: body.reminderEnabled === undefined ? existing.reminderEnabled : parseBool(body.reminderEnabled),
        active: body.active === undefined ? existing.active : parseBool(body.active),
      },
      include: { medicationEvents: { orderBy: { scheduledTime: 'desc' }, take: 10 } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Medication update error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const activeProfile = await getActiveProfile(user.id);
    const medication = await prisma.medication.findFirst({ where: { id, familyProfileId: activeProfile.id } });
    if (!medication) return NextResponse.json({ error: 'Medication not found' }, { status: 404 });

    await prisma.medication.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Medication delete error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
