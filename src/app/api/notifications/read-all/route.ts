import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getActiveProfile, getSessionUser } from '@/src/lib/auth';
import { canUsePermission, resolveActiveProfileAccess } from '@/src/lib/authorization';
const db = prisma;

export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await resolveActiveProfileAccess(user.id);
    if (!canUsePermission(access, 'dashboard.summary.view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const activeProfile = await getActiveProfile(user.id);
    const result = await db.notification.updateMany({
      where: { familyProfileId: activeProfile.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Notifications read-all error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
