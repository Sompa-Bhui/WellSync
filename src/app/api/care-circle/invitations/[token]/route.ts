import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser } from '@/src/lib/auth';
import { writeAuditLog } from '@/src/lib/audit';
import { invitationIsExpired, normalizeEmail } from '@/src/lib/care-circle';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const invitation = await prisma.careCircleInvitation.findUnique({ where: { token } });
  if (!invitation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const expired = invitationIsExpired(invitation);
  return NextResponse.json({ email: invitation.email, relationshipLabel: invitation.relationshipLabel, role: invitation.role, status: expired ? 'expired' : invitation.status, expiresAt: invitation.expiresAt });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { token } = await ctx.params;
  const invitation = await prisma.careCircleInvitation.findUnique({ where: { token } });
  if (!invitation) return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
  if (invitationIsExpired(invitation)) return NextResponse.json({ error: 'Invitation expired or unavailable' }, { status: 410 });
  const body = await req.json();
  const decision = String(body.decision || '').toLowerCase();
  if (decision === 'decline') {
    await prisma.careCircleInvitation.update({ where: { token }, data: { status: 'declined', revokedAt: new Date() } });
    await writeAuditLog({ userId: user.id, action: 'CARE_CIRCLE_INVITE_DECLINED', target: `FamilyProfile:${invitation.familyProfileId}` });
    return NextResponse.json({ success: true });
  }
  if (decision !== 'accept') return NextResponse.json({ error: 'decision must be accept or decline' }, { status: 400 });
  if (normalizeEmail(user.email) !== normalizeEmail(invitation.email)) {
    return NextResponse.json({ error: 'Invitation is not for this account' }, { status: 403 });
  }
  const existing = await prisma.careCircleMember.findFirst({
    where: { familyProfileId: invitation.familyProfileId, userId: user.id, active: true },
  });
  if (existing) return NextResponse.json({ error: 'Member already exists' }, { status: 409 });
  const member = await prisma.careCircleMember.create({
    data: {
      userId: user.id,
      familyProfileId: invitation.familyProfileId,
      invitationId: invitation.id,
      email: invitation.email,
      relationshipLabel: invitation.relationshipLabel,
      role: invitation.role,
      permissions: invitation.permissions,
      active: true,
      acceptedAt: new Date(),
    },
  });
  await prisma.careCircleInvitation.update({ where: { token }, data: { status: 'accepted', acceptedAt: new Date() } });
  await writeAuditLog({ userId: user.id, action: 'CARE_CIRCLE_INVITE_ACCEPTED', target: `FamilyProfile:${invitation.familyProfileId}` });
  return NextResponse.json(member, { status: 201 });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { token } = await ctx.params;
  const invitation = await prisma.careCircleInvitation.findUnique({ where: { token } });
  if (!invitation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (invitation.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (invitation.status !== 'pending') return NextResponse.json({ error: 'Invitation no longer pending' }, { status: 409 });
  await prisma.careCircleInvitation.update({ where: { token }, data: { status: 'revoked', revokedAt: new Date() } });
  await writeAuditLog({ userId: user.id, action: 'CARE_CIRCLE_INVITE_REVOKED', target: `FamilyProfile:${invitation.familyProfileId}` });
  return NextResponse.json({ success: true });
}
