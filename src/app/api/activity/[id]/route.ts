import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getActiveProfile, getSessionUser } from '@/src/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const activeProfile = await getActiveProfile(user.id);
    const existing = await prisma.workoutEntry.findFirst({ where: { id, familyProfileId: activeProfile.id } });
    if (!existing) return NextResponse.json({ error: 'Activity not found' }, { status: 404 });

    const body = await req.json();
    const updated = await prisma.workoutEntry.update({
      where: { id },
      data: {
        type: body.type ?? existing.type,
        durationMinutes: body.durationMinutes ? Number(body.durationMinutes) : existing.durationMinutes,
        distance: body.distance === '' || body.distance === null ? null : body.distance ?? existing.distance,
        steps: body.steps === '' || body.steps === null ? null : body.steps ?? existing.steps,
        notes: body.notes ?? existing.notes,
        date: body.date ?? existing.date,
        timestamp: body.timestamp ? new Date(body.timestamp) : existing.timestamp,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Activity PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const activeProfile = await getActiveProfile(user.id);
    const existing = await prisma.workoutEntry.findFirst({ where: { id, familyProfileId: activeProfile.id } });
    if (!existing) return NextResponse.json({ error: 'Activity not found' }, { status: 404 });

    await prisma.workoutEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Activity DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
