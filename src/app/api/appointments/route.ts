import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser, getActiveProfile } from '@/src/lib/auth';
import { APPOINTMENT_STATUSES, serializeListField, createAppointmentTimelineEvent } from '@/src/lib/appointments';
import { resolveActiveProfileAccess, canUsePermission } from '@/src/lib/authorization';
import { upsertSourceReminder } from '@/src/lib/reminders';

function isValidTime(time: unknown) {
  return typeof time === 'string' && /^\d{2}:\d{2}$/.test(time);
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const activeProfile = await getActiveProfile(user.id);
    const access = await resolveActiveProfileAccess(user.id);
    if (!canUsePermission(access, 'appointments.view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const view = url.searchParams.get('view');

    const appointments = await prisma.appointment.findMany({
      where: {
        familyProfileId: activeProfile.id,
        ...(status && status !== 'all' ? { status } : {}),
      },
      include: {
        doctor: true,
        medicalRecords: true,
      },
      orderBy: [
        { date: view === 'past' ? 'desc' : 'asc' },
        { time: view === 'past' ? 'desc' : 'asc' },
      ],
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Appointments GET error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const access = await resolveActiveProfileAccess(user.id);
    if (!canUsePermission(access, 'appointments.manage')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const activeProfile = await getActiveProfile(user.id);
    const body = await req.json();
    const { doctorId, doctorName, specialty, clinic, contactInfo, date, time, isVirtual, status, reason, notes, preparationList, followUpDate } = body;

    if (!date || !isValidTime(time)) {
      return NextResponse.json({ error: 'Valid date and time are required' }, { status: 400 });
    }

    let resolvedDoctorId = typeof doctorId === 'string' && doctorId ? doctorId : null;
    if (!resolvedDoctorId) {
      if (!doctorName || !specialty || !clinic) {
        return NextResponse.json({ error: 'Doctor details are required when doctorId is not provided' }, { status: 400 });
      }
      const doctor = await prisma.doctor.create({
        data: {
          name: String(doctorName),
          specialty: String(specialty),
          clinic: String(clinic),
          contactInfo: contactInfo ? String(contactInfo) : null,
        },
      });
      resolvedDoctorId = doctor.id;
    }

    const appointment = await prisma.appointment.create({
      data: {
        familyProfileId: activeProfile.id,
        doctorId: resolvedDoctorId,
        date: String(date),
        time: String(time),
        isVirtual: Boolean(isVirtual),
        status: APPOINTMENT_STATUSES.includes(String(status) as never) ? String(status) : 'PENDING',
        reason: reason ? String(reason) : null,
        notes: notes ? String(notes) : null,
        preparationList: serializeListField(preparationList),
        followUpDate: followUpDate ? String(followUpDate) : null,
      },
      include: { doctor: true, medicalRecords: true },
    });

    await createAppointmentTimelineEvent({
      familyProfileId: activeProfile.id,
      eventId: appointment.id,
      title: `Appointment scheduled with ${appointment.doctor.name}`,
      description: `${appointment.date} at ${appointment.time}${appointment.isVirtual ? ' (virtual)' : ''}.`,
    });

    await upsertSourceReminder({
      familyProfileId: activeProfile.id,
      createdByUserId: user.id,
      sourceType: 'APPOINTMENT',
      sourceId: appointment.id,
      title: `Appointment with ${appointment.doctor.name}`,
      description: `${appointment.date} at ${appointment.time}${appointment.isVirtual ? ' (virtual)' : ''}.`,
      scheduledAt: new Date(`${appointment.date}T${appointment.time}:00.000Z`),
      recurrence: JSON.stringify({ type: 'NONE' }),
      reminderType: 'APPOINTMENT',
      enabled: appointment.status !== 'CANCELLED',
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error('Appointments POST error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
