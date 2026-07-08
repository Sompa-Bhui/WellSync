import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getActiveProfile, getSessionUser } from '@/src/lib/auth';
import { canUsePermission, resolveActiveProfileAccess } from '@/src/lib/authorization';
const db = prisma;

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await resolveActiveProfileAccess(user.id);
    if (!canUsePermission(access, 'dashboard.summary.view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const activeProfile = await getActiveProfile(user.id);
    const url = new URL(req.url);
    const unreadOnly = url.searchParams.get('unreadOnly') === '1';

    const notifications = await db.notification.findMany({
      where: {
        familyProfileId: activeProfile.id,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: [{ timestamp: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });

    const unreadCount = await db.notification.count({
      where: { familyProfileId: activeProfile.id, isRead: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
