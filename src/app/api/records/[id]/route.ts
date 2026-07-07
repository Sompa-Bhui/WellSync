import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser } from '@/src/lib/auth';
import { ensureAppointmentOwnership } from '@/src/lib/appointments';
import { ensureRecordOwnership, RECORD_CATEGORIES, serializeTags, recordTimelineEvent } from '@/src/lib/records';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await ctx.params;
    const record = await ensureRecordOwnership(user.id, id);
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(record);
  } catch (error) {
    console.error('Record detail GET error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await ctx.params;
    const record = await ensureRecordOwnership(user.id, id);
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    if (body.appointmentId) {
      const linked = await ensureAppointmentOwnership(user.id, String(body.appointmentId));
      if (!linked) return NextResponse.json({ error: 'appointmentId is invalid or unauthorized' }, { status: 400 });
    }
    const updated = await prisma.medicalRecord.update({
      where: { id },
      data: {
        title: body.title ? String(body.title) : record.title,
        category: body.category && RECORD_CATEGORIES.includes(String(body.category) as never) ? String(body.category) : record.category,
        provider: body.provider ? String(body.provider) : record.provider,
        date: body.date ? String(body.date) : record.date,
        fileUrl: body.fileUrl ? String(body.fileUrl) : record.fileUrl,
        notes: body.notes !== undefined ? (body.notes ? String(body.notes) : null) : record.notes,
        tags: body.tags !== undefined ? serializeTags(body.tags) : record.tags,
        appointmentId: body.appointmentId !== undefined ? (body.appointmentId ? String(body.appointmentId) : null) : record.appointmentId,
      },
      include: { appointment: { include: { doctor: true } } },
    });

    await recordTimelineEvent({
      familyProfileId: updated.familyProfileId,
      eventType: updated.category === 'LAB_REPORT' ? 'LAB_REPORT' : updated.category === 'PRESCRIPTION' ? 'PRESCRIPTION' : updated.category === 'IMAGING' ? 'IMAGING' : 'RECORD',
      eventId: updated.id,
      title: `Record updated: ${updated.title}`,
      description: `Updated metadata for ${updated.title}.`,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Record PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await ctx.params;
    const record = await ensureRecordOwnership(user.id, id);
    if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await prisma.medicalRecord.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Record DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
