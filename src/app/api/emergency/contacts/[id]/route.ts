import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser, getActiveProfile } from '@/src/lib/auth';
import { writeAuditLog } from '@/src/lib/audit';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const active = await getActiveProfile(user.id);
  const { id } = await ctx.params;
  const existing = await prisma.emergencyContact.findFirst({ where: { id, familyProfileId: active.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = await req.json();
  const updated = await prisma.emergencyContact.update({
    where: { id },
    data: {
      name: body.name === undefined ? existing.name : String(body.name),
      relationship: body.relationship === undefined ? existing.relationship : String(body.relationship),
      phone: body.phone === undefined ? existing.phone : String(body.phone),
      alternatePhone: body.alternatePhone === undefined ? existing.alternatePhone : (body.alternatePhone ? String(body.alternatePhone) : null),
      priority: body.priority === undefined ? existing.priority : Number(body.priority),
      notes: body.notes === undefined ? existing.notes : (body.notes ? String(body.notes) : null),
      active: typeof body.active === 'boolean' ? body.active : existing.active,
    },
  });
  await writeAuditLog({ userId: user.id, action: 'EMERGENCY_CONTACT_UPDATED', target: `FamilyProfile:${active.id}` });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const active = await getActiveProfile(user.id);
  const { id } = await ctx.params;
  const existing = await prisma.emergencyContact.findFirst({ where: { id, familyProfileId: active.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.emergencyContact.delete({ where: { id } });
  await writeAuditLog({ userId: user.id, action: 'EMERGENCY_CONTACT_DELETED', target: `FamilyProfile:${active.id}` });
  return NextResponse.json({ success: true });
}
