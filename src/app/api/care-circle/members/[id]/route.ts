import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser } from '@/src/lib/auth';
import { writeAuditLog } from '@/src/lib/audit';
import { ensureCareCircleOwnership } from '@/src/lib/care-circle';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const member = await prisma.careCircleMember.findUnique({ where: { id } });
  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const ownsProfile = await ensureCareCircleOwnership(user.id, member.familyProfileId);
  const isSelf = member.userId === user.id;
  if (!ownsProfile && !isSelf) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const body = await req.json();
  if (isSelf) return NextResponse.json({ error: 'Members cannot edit their own role or permissions' }, { status: 403 });
  const updated = await prisma.careCircleMember.update({
    where: { id },
    data: {
      role: body.role || member.role,
      permissions: body.permissions ? JSON.stringify(body.permissions) : member.permissions,
      relationshipLabel: body.relationshipLabel ? String(body.relationshipLabel) : member.relationshipLabel,
      active: typeof body.active === 'boolean' ? body.active : member.active,
      revokedAt: body.active === false ? new Date() : member.revokedAt,
    },
  });
  await writeAuditLog({ userId: user.id, action: 'CARE_CIRCLE_MEMBER_UPDATED', target: `FamilyProfile:${member.familyProfileId}` });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const member = await prisma.careCircleMember.findUnique({ where: { id } });
  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const ownsProfile = await ensureCareCircleOwnership(user.id, member.familyProfileId);
  const isSelf = member.userId === user.id;
  if (!ownsProfile && !isSelf) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.careCircleMember.update({ where: { id }, data: { active: false, revokedAt: new Date() } });
  await writeAuditLog({ userId: user.id, action: 'CARE_CIRCLE_ACCESS_REVOKED', target: `FamilyProfile:${member.familyProfileId}` });
  return NextResponse.json({ success: true });
}
