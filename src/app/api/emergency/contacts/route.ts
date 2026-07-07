import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser, getActiveProfile } from '@/src/lib/auth';
import { writeAuditLog } from '@/src/lib/audit';

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const active = await getActiveProfile(user.id);
  const body = await req.json();
  const contact = await prisma.emergencyContact.create({
    data: {
      familyProfileId: active.id,
      name: String(body.name),
      relationship: String(body.relationship),
      phone: String(body.phone),
      alternatePhone: body.alternatePhone ? String(body.alternatePhone) : null,
      priority: Number(body.priority || 1),
      notes: body.notes ? String(body.notes) : null,
      active: body.active !== false,
    },
  });
  await writeAuditLog({ userId: user.id, action: 'EMERGENCY_CONTACT_CREATED', target: `FamilyProfile:${active.id}` });
  return NextResponse.json(contact, { status: 201 });
}
