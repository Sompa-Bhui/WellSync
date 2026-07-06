import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getActiveProfile, getSessionUser } from '@/src/lib/auth';
import { ensureTodayMedicationEvents, MEDICATION_FREQUENCIES, parseScheduleTimes } from '@/src/lib/medications';

function parseBool(value: unknown) {
  return value === true || value === 'true';
}

function validateMedicationPayload(body: Record<string, unknown>) {
  const errors: string[] = [];
  if (!body.name || typeof body.name !== 'string') errors.push('name is required');
  if (!body.dosage || typeof body.dosage !== 'string') errors.push('dosage is required');
  if (!body.unit || typeof body.unit !== 'string') errors.push('unit is required');
  if (!body.frequency || typeof body.frequency !== 'string' || !MEDICATION_FREQUENCIES.includes(body.frequency as never)) errors.push('frequency is invalid');
  if (!body.scheduleTimes || typeof body.scheduleTimes !== 'string' || parseScheduleTimes(body.scheduleTimes).length === 0) errors.push('scheduleTimes must include at least one time');
  if (!body.startDate || typeof body.startDate !== 'string') errors.push('startDate is required');
  return errors;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const activeProfile = await getActiveProfile(user.id);
    const url = new URL(req.url);
    const active = url.searchParams.get('active');
    const includeEvents = url.searchParams.get('includeEvents') === '1';

    await ensureTodayMedicationEvents(user.id);

    const medications = await prisma.medication.findMany({
      where: {
        familyProfileId: activeProfile.id,
        ...(active === 'true' ? { active: true } : active === 'false' ? { active: false } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: includeEvents ? { medicationEvents: { orderBy: { scheduledTime: 'desc' }, take: 15 } } : undefined,
    });

    return NextResponse.json(medications);
  } catch (error) {
    console.error('Medication list error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const activeProfile = await getActiveProfile(user.id);
    const body = await req.json();
    const errors = validateMedicationPayload(body);
    if (errors.length > 0) return NextResponse.json({ error: errors.join(', ') }, { status: 400 });

    const medication = await prisma.medication.create({
      data: {
        familyProfileId: activeProfile.id,
        name: body.name as string,
        dosage: body.dosage as string,
        unit: body.unit ? String(body.unit) : 'mg',
        frequency: body.frequency as string,
        scheduleTimes: body.scheduleTimes as string,
        startDate: body.startDate as string,
        endDate: body.endDate ? String(body.endDate) : null,
        instructions: body.instructions ? String(body.instructions) : null,
        refillDate: body.refillDate ? String(body.refillDate) : null,
        reminderEnabled: parseBool(body.reminderEnabled),
        active: body.active === false ? false : true,
      },
      include: {
        medicationEvents: { orderBy: { scheduledTime: 'desc' }, take: 10 },
      },
    });

    return NextResponse.json(medication, { status: 201 });
  } catch (error) {
    console.error('Medication create error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
