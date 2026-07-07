import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser, getActiveProfile } from '@/src/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const active = await getActiveProfile(user.id);
  const logs = await prisma.auditLog.findMany({ where: { userId: user.id }, orderBy: { timestamp: 'desc' }, take: 50 });
  return NextResponse.json({ activeProfileId: active.id, logs });
}
