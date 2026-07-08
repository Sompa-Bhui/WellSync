import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser } from '@/src/lib/auth';
import { ensureAppointmentOwnership, createAppointmentTimelineEvent, parseListField, serializeListField } from '@/src/lib/appointments';
import { resolveActiveProfileAccess, canUsePermission } from '@/src/lib/authorization';
import { upsertSourceReminder } from '@/src/lib/reminders';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await ctx.params;
    const access = await resolveActiveProfileAccess(user.id);
    if (!canUsePermission(access, 'appointments.view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const appointment = await ensureAppointmentOwnership(user.id, id);
    if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({
      ...appointment,
      preparationList: parseListField(appointment.preparationList),
    });
  } catch (error) {
    console.error('Appointment GET error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await ctx.params;
    const access = await resolveActiveProfileAccess(user.id);
    if (!canUsePermission(access, 'appointments.manage')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const existing = await ensureAppointmentOwnership(user.id, id);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const action = String(body.action || 'update');

    let updated;
    if (action === 'reschedule') {
      const newDate = String(body.date || '');
      const newTime = String(body.time || '');
      if (!newDate || !/^\d{2}:\d{2}$/.test(newTime)) {
        return NextResponse.json({ error: 'Valid date and time are required' }, { status: 400 });
      }
      updated = await prisma.appointment.update({
        where: { id },
        data: {
          date: newDate,
          time: newTime,
          status: 'RESCHEDULED',
          notes: body.notes ? String(body.notes) : existing.notes,
          followUpDate: body.followUpDate ? String(body.followUpDate) : existing.followUpDate,
        },
        include: { doctor: true, medicalRecords: true },
      });
      await createAppointmentTimelineEvent({
        familyProfileId: existing.familyProfileId,
        eventId: existing.id,
        title: `Appointment rescheduled to ${newDate} ${newTime}`,
        description: `Previous time preserved in timeline. New status: RESCHEDULED.`,
      });
      await upsertSourceReminder({
        familyProfileId: existing.familyProfileId,
        createdByUserId: user.id,
        sourceType: 'APPOINTMENT',
        sourceId: existing.id,
        title: `Appointment with ${existing.doctor.name}`,
        description: updated.notes || `${newDate} ${newTime}`,
        scheduledAt: new Date(`${newDate}T${newTime}:00.000Z`),
        recurrence: JSON.stringify({ type: 'NONE' }),
        reminderType: 'APPOINTMENT',
        enabled: true,
      });
    } else if (action === 'complete') {
      updated = await prisma.appointment.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          notes: body.notes ? String(body.notes) : existing.notes,
        },
        include: { doctor: true, medicalRecords: true },
      });
      await createAppointmentTimelineEvent({
        familyProfileId: existing.familyProfileId,
        eventId: existing.id,
        title: `Appointment completed with ${existing.doctor.name}`,
        description: 'Visit marked complete and post-visit records can now be added.',
      });
      await upsertSourceReminder({
        familyProfileId: existing.familyProfileId,
        createdByUserId: user.id,
        sourceType: 'APPOINTMENT',
        sourceId: existing.id,
        title: `Appointment with ${existing.doctor.name}`,
        description: existing.notes || existing.reason || 'Completed appointment.',
        scheduledAt: new Date(`${existing.date}T${existing.time}:00.000Z`),
        recurrence: JSON.stringify({ type: 'NONE' }),
        reminderType: 'APPOINTMENT',
        enabled: false,
      });
    } else if (action === 'cancel') {
      updated = await prisma.appointment.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          notes: body.notes ? String(body.notes) : existing.notes,
        },
        include: { doctor: true, medicalRecords: true },
      });
      await createAppointmentTimelineEvent({
        familyProfileId: existing.familyProfileId,
        eventId: existing.id,
        title: `Appointment cancelled with ${existing.doctor.name}`,
        description: body.notes ? String(body.notes) : 'Appointment cancelled.',
      });
      await upsertSourceReminder({
        familyProfileId: existing.familyProfileId,
        createdByUserId: user.id,
        sourceType: 'APPOINTMENT',
        sourceId: existing.id,
        title: `Appointment with ${existing.doctor.name}`,
        description: body.notes ? String(body.notes) : 'Appointment cancelled.',
        scheduledAt: new Date(`${existing.date}T${existing.time}:00.000Z`),
        recurrence: JSON.stringify({ type: 'NONE' }),
        reminderType: 'APPOINTMENT',
        enabled: false,
      });
    } else {
      updated = await prisma.appointment.update({
        where: { id },
        data: {
          doctorId: body.doctorId ? String(body.doctorId) : existing.doctorId,
          date: body.date ? String(body.date) : existing.date,
          time: body.time ? String(body.time) : existing.time,
          isVirtual: typeof body.isVirtual === 'boolean' ? body.isVirtual : existing.isVirtual,
          status: body.status && ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'MISSED'].includes(String(body.status)) ? String(body.status) : existing.status,
          reason: body.reason ? String(body.reason) : existing.reason,
          notes: body.notes ? String(body.notes) : existing.notes,
          preparationList: body.preparationList ? serializeListField(body.preparationList) : existing.preparationList,
          followUpDate: body.followUpDate ? String(body.followUpDate) : existing.followUpDate,
        },
        include: { doctor: true, medicalRecords: true },
      });
      await upsertSourceReminder({
        familyProfileId: existing.familyProfileId,
        createdByUserId: user.id,
        sourceType: 'APPOINTMENT',
        sourceId: existing.id,
        title: `Appointment with ${existing.doctor.name}`,
        description: updated.notes || updated.reason || null,
        scheduledAt: new Date(`${updated.date}T${updated.time}:00.000Z`),
        recurrence: JSON.stringify({ type: 'NONE' }),
        reminderType: 'APPOINTMENT',
        enabled: updated.status !== 'CANCELLED',
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Appointment PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await ctx.params;
    const access = await resolveActiveProfileAccess(user.id);
    if (!canUsePermission(access, 'appointments.manage')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const existing = await ensureAppointmentOwnership(user.id, id);
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.appointment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Appointment DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
