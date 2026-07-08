import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getActiveProfile, getSessionUser } from '@/src/lib/auth';
import { canUsePermission, resolveActiveProfileAccess } from '@/src/lib/authorization';
const db = prisma;

export async function PATCH(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await resolveActiveProfileAccess(user.id);
    if (!canUsePermission(access, 'dashboard.summary.view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await ctx.params;
    const activeProfile = await getActiveProfile(user.id);
    const notification = await db.notification.findFirst({
      where: { id, familyProfileId: activeProfile.id },
    });
    if (!notification) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = await db.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Notification PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
