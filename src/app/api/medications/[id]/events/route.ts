import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getActiveProfile, getSessionUser } from '@/src/lib/auth';

function normalizeStatus(status: unknown) {
  const value = String(status || '').toUpperCase();
  return ['PENDING', 'TAKEN', 'SKIPPED', 'MISSED'].includes(value) ? value : null;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const activeProfile = await getActiveProfile(user.id);
    const medication = await prisma.medication.findFirst({ where: { id, familyProfileId: activeProfile.id } });
    if (!medication) return NextResponse.json({ error: 'Medication not found' }, { status: 404 });

    const events = await prisma.medicationEvent.findMany({
      where: { familyProfileId: activeProfile.id, medicationId: id },
      orderBy: { scheduledTime: 'desc' },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Medication events GET error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const activeProfile = await getActiveProfile(user.id);
    const medication = await prisma.medication.findFirst({ where: { id, familyProfileId: activeProfile.id } });
    if (!medication) return NextResponse.json({ error: 'Medication not found' }, { status: 404 });

    const body = await req.json();
    const scheduledTime = body.scheduledTime ? new Date(body.scheduledTime) : null;
    const status = normalizeStatus(body.status) || 'PENDING';
    if (!scheduledTime) return NextResponse.json({ error: 'scheduledTime is required' }, { status: 400 });

    const event = await prisma.medicationEvent.create({
      data: {
        familyProfileId: activeProfile.id,
        medicationId: id,
        scheduledTime,
        status,
        timestamp: body.timestamp ? new Date(body.timestamp) : status === 'PENDING' ? null : new Date(),
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Medication events POST error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
