import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser, getActiveProfile } from '@/src/lib/auth';
import { writeAuditLog } from '@/src/lib/audit';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const active = await getActiveProfile(user.id);
  const handoffs = await prisma.caregiverHandoff.findMany({ where: { familyProfileId: active.id }, orderBy: { handoffDateTime: 'desc' } });
  return NextResponse.json(handoffs);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const active = await getActiveProfile(user.id);
  const body = await req.json();
  const handoff = await prisma.caregiverHandoff.create({
    data: {
      familyProfileId: active.id,
      outgoingCaregiverId: body.outgoingCaregiverId || null,
      incomingCaregiverId: body.incomingCaregiverId || null,
      handoffDateTime: new Date(body.handoffDateTime),
      summary: String(body.summary || ''),
      completedTasks: body.completedTasks || null,
      pendingTasks: body.pendingTasks || null,
      medicationNotes: body.medicationNotes || null,
      appointmentNotes: body.appointmentNotes || null,
      generalNotes: body.generalNotes || null,
    },
  });
  await writeAuditLog({ userId: user.id, action: 'HANDOFF_CREATED', target: `FamilyProfile:${active.id}` });
  return NextResponse.json(handoff, { status: 201 });
}
