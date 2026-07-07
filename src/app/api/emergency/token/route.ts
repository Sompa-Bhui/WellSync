import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser, getActiveProfile } from '@/src/lib/auth';
import { writeAuditLog } from '@/src/lib/audit';

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const active = await getActiveProfile(user.id);
  const profile = await prisma.emergencyProfile.findUnique({ where: { familyProfileId: active.id } });
  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = await req.json();
  const updated = await prisma.emergencyProfile.update({
    where: { familyProfileId: active.id },
    data: { token: crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, ''), active: body.active === false ? false : true, expiresAt: body.expiresAt ? new Date(body.expiresAt) : null },
  });
  await writeAuditLog({ userId: user.id, action: 'EMERGENCY_TOKEN_ROTATED', target: `FamilyProfile:${active.id}` });
  return NextResponse.json(updated);
}
