import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser } from '@/src/lib/auth';
import { ensureCareCircleOwnership, buildPermissions, randomToken, normalizeEmail, hasPendingInvitation } from '@/src/lib/care-circle';
import { writeAuditLog } from '@/src/lib/audit';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const [invitations, members] = await Promise.all([
    prisma.careCircleInvitation.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
    prisma.careCircleMember.findMany({ where: { userId: user.id, active: true }, include: { familyProfile: true }, orderBy: { createdAt: 'desc' } }),
  ]);
  return NextResponse.json({ invitations, members });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  if (!body.familyProfileId || !body.email || !body.role) return NextResponse.json({ error: 'familyProfileId, email, role required' }, { status: 400 });
  const owned = await ensureCareCircleOwnership(user.id, String(body.familyProfileId));
  if (!owned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (String(body.email).trim().toLowerCase() === user.email.toLowerCase()) return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 });
  const email = normalizeEmail(String(body.email));
  if (email === normalizeEmail(user.email)) return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 });
  const existingMember = await prisma.careCircleMember.findFirst({ where: { familyProfileId: String(body.familyProfileId), email, active: true } });
  if (existingMember) return NextResponse.json({ error: 'Member already exists' }, { status: 409 });
  const pending = await hasPendingInvitation(String(body.familyProfileId), email);
  if (pending) return NextResponse.json({ error: 'Invitation already pending' }, { status: 409 });
  const invitation = await prisma.careCircleInvitation.create({
    data: {
      userId: user.id,
      familyProfileId: String(body.familyProfileId),
      email,
      relationshipLabel: String(body.relationshipLabel || 'Trusted caregiver'),
      role: String(body.role),
      permissions: buildPermissions(String(body.role), body.permissions),
      status: 'pending',
      token: randomToken(),
      expiresAt: body.expiresAt ? new Date(String(body.expiresAt)) : null,
    },
  });
  await writeAuditLog({ userId: user.id, action: 'CARE_CIRCLE_INVITE_CREATED', target: `FamilyProfile:${body.familyProfileId}` });
  return NextResponse.json(invitation, { status: 201 });
}
