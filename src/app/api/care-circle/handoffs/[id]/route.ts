import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser, getActiveProfile } from '@/src/lib/auth';
import { writeAuditLog } from '@/src/lib/audit';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const active = await getActiveProfile(user.id);
  const { id } = await ctx.params;
  const handoff = await prisma.caregiverHandoff.findFirst({ where: { id, familyProfileId: active.id } });
  if (!handoff) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const updated = await prisma.caregiverHandoff.update({ where: { id }, data: { acknowledgmentStatus: 'acknowledged', acknowledgedAt: new Date() } });
  await writeAuditLog({ userId: user.id, action: 'HANDOFF_ACKNOWLEDGED', target: `FamilyProfile:${active.id}` });
  return NextResponse.json(updated);
}
