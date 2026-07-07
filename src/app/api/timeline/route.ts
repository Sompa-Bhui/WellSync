import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser, getActiveProfile } from '@/src/lib/auth';
import { resolveActiveProfileAccess, canUsePermission } from '@/src/lib/authorization';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const activeProfile = await getActiveProfile(user.id);
    const access = await resolveActiveProfileAccess(user.id);
    if (!canUsePermission(access, 'timeline.view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const url = new URL(req.url);
    const eventType = url.searchParams.get('eventType');
    const cursor = url.searchParams.get('cursor');
    const take = Math.min(Number(url.searchParams.get('take') || '20'), 50);

    const events = await prisma.timelineEvent.findMany({
      where: {
        familyProfileId: activeProfile.id,
        ...(eventType && eventType !== 'all' ? { eventType } : {}),
      },
      orderBy: { timestamp: 'desc' },
      take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = events.length > take;
    return NextResponse.json({
      items: hasMore ? events.slice(0, take) : events,
      nextCursor: hasMore ? events[take - 1]?.id ?? null : null,
    });
  } catch (error) {
    console.error('Timeline GET error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
