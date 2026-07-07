import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser } from '@/src/lib/auth';
import { ensureAppointmentOwnership, createFollowUpTimelineEvent } from '@/src/lib/appointments';
import { resolveActiveProfileAccess, canUsePermission } from '@/src/lib/authorization';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await ctx.params;
    const access = await resolveActiveProfileAccess(user.id);
    if (!canUsePermission(access, 'followups.view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const appointment = await ensureAppointmentOwnership(user.id, id);
    if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const followUps = await prisma.followUpTask.findMany({
      where: { appointmentId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(followUps);
  } catch (error) {
    console.error('Follow-up GET error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await ctx.params;
    const access = await resolveActiveProfileAccess(user.id);
    if (!canUsePermission(access, 'followups.manage')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const appointment = await ensureAppointmentOwnership(user.id, id);
    if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    if (!body.title || !body.dueDate) {
      return NextResponse.json({ error: 'title and dueDate are required' }, { status: 400 });
    }

    const followUp = await prisma.followUpTask.create({
      data: {
        familyProfileId: appointment.familyProfileId,
        appointmentId: appointment.id,
        title: String(body.title),
        details: body.details ? String(body.details) : null,
        dueDate: String(body.dueDate),
        status: 'pending',
      },
    });

    await createFollowUpTimelineEvent({
      familyProfileId: appointment.familyProfileId,
      eventId: appointment.id,
      title: `Follow-up created: ${followUp.title}`,
      description: `Due ${followUp.dueDate}.`,
    });

    return NextResponse.json(followUp, { status: 201 });
  } catch (error) {
    console.error('Follow-up POST error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await ctx.params;
    const access = await resolveActiveProfileAccess(user.id);
    if (!canUsePermission(access, 'followups.manage')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const appointment = await ensureAppointmentOwnership(user.id, id);
    if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const followUpId = String(body.followUpId || '');
    if (!followUpId) return NextResponse.json({ error: 'followUpId is required' }, { status: 400 });

    const followUp = await prisma.followUpTask.findFirst({
      where: { id: followUpId, familyProfileId: appointment.familyProfileId },
    });

    if (!followUp) return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });

    const nextStatus = String(body.status || followUp.status);
    const scheduledAppointmentId = body.scheduledAppointmentId ? String(body.scheduledAppointmentId) : followUp.scheduledAppointmentId;

    const updated = await prisma.followUpTask.update({
      where: { id: followUp.id },
      data: {
        status: ['pending', 'scheduled', 'completed', 'dismissed'].includes(nextStatus) ? nextStatus : followUp.status,
        details: body.details ? String(body.details) : followUp.details,
        dueDate: body.dueDate ? String(body.dueDate) : followUp.dueDate,
        scheduledAppointmentId,
        completedAt: nextStatus === 'completed' ? new Date() : nextStatus === 'dismissed' ? null : followUp.completedAt,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Follow-up PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
