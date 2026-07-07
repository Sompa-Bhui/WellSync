import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser, getActiveProfile } from '@/src/lib/auth';
import { ensureAppointmentOwnership } from '@/src/lib/appointments';
import { RECORD_CATEGORIES, serializeTags, recordTimelineEvent } from '@/src/lib/records';

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const activeProfile = await getActiveProfile(user.id);
    const url = new URL(req.url);
    const q = (url.searchParams.get('q') || '').toLowerCase();
    const category = url.searchParams.get('category');

    const records = await prisma.medicalRecord.findMany({
      where: {
        familyProfileId: activeProfile.id,
        ...(category && category !== 'all' ? { category } : {}),
      },
      include: { appointment: { include: { doctor: true } } },
      orderBy: { date: 'desc' },
    });

    const filtered = records.filter((record) => {
      if (!q) return true;
      const haystack = [
        record.title,
        record.provider,
        record.category,
        record.tags || '',
        record.notes || '',
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Records GET error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const activeProfile = await getActiveProfile(user.id);
    const body = await req.json();
    if (!body.title || !body.category || !body.date || !body.provider) {
      return NextResponse.json({ error: 'title, category, date, and provider are required' }, { status: 400 });
    }

    if (body.appointmentId) {
      const linked = await ensureAppointmentOwnership(user.id, String(body.appointmentId));
      if (!linked) return NextResponse.json({ error: 'appointmentId is invalid or unauthorized' }, { status: 400 });
    }

    const record = await prisma.medicalRecord.create({
      data: {
        familyProfileId: activeProfile.id,
        appointmentId: body.appointmentId ? String(body.appointmentId) : null,
        title: String(body.title),
        category: RECORD_CATEGORIES.includes(String(body.category) as never) ? String(body.category) : 'OTHER',
        provider: String(body.provider),
        date: String(body.date),
        fileUrl: String(body.fileUrl || '/records/metadata-only'),
        notes: body.notes ? String(body.notes) : null,
        tags: serializeTags(body.tags),
      },
      include: { appointment: { include: { doctor: true } } },
    });

    await recordTimelineEvent({
      familyProfileId: activeProfile.id,
      eventType: record.category === 'LAB_REPORT' ? 'LAB_REPORT' : record.category === 'PRESCRIPTION' ? 'PRESCRIPTION' : record.category === 'IMAGING' ? 'IMAGING' : 'RECORD',
      eventId: record.id,
      title: `Record added: ${record.title}`,
      description: `${record.category} from ${record.provider} on ${record.date}.`,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Records POST error:', error);
    return NextResponse.json({ error: 'Internal server error occurred' }, { status: 500 });
  }
}
