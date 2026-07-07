import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser, getActiveProfile } from '@/src/lib/auth';
import { recordTimelineEvent } from '@/src/lib/records';
import { resolveActiveProfileAccess } from '@/src/lib/authorization';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await resolveActiveProfileAccess(user.id);
    if (!access || access.accessType !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const activeProfile = await getActiveProfile(user.id);
    const body = await req.json();
    if (!body.title || !body.description) {
      return NextResponse.json({ error: 'title and description are required' }, { status: 400 });
    }

    const event = await recordTimelineEvent({
      familyProfileId: activeProfile.id,
      eventType: 'RECORD',
      title: String(body.title),
      description: String(body.description),
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE_TIMELINE_EVENT',
        target: `TimelineEvent id: ${event.id}`,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Manual timeline POST error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
