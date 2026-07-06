import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getActiveProfile, getSessionUser } from '@/src/lib/auth';

function normalizeStatus(status: unknown) {
  const value = String(status || '').toUpperCase();
  return ['PENDING', 'TAKEN', 'SKIPPED', 'MISSED'].includes(value) ? value : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { eventId } = await params;
    const activeProfile = await getActiveProfile(user.id);
    const existing = await prisma.medicationEvent.findFirst({
      where: { id: eventId, familyProfileId: activeProfile.id },
    });
    if (!existing) return NextResponse.json({ error: 'Medication event not found' }, { status: 404 });

    const body = await req.json();
    const status = normalizeStatus(body.status);
    if (!status) return NextResponse.json({ error: 'status is invalid' }, { status: 400 });

    const updated = await prisma.medicationEvent.update({
      where: { id: eventId },
      data: {
        status,
        timestamp: status === 'PENDING' ? null : body.timestamp ? new Date(body.timestamp) : new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Medication event update error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
