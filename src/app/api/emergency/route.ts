import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';
import { getSessionUser, getActiveProfile } from '@/src/lib/auth';
import { writeAuditLog } from '@/src/lib/audit';
import { resolveActiveProfileAccess, canUsePermission } from '@/src/lib/authorization';
import { getEmergencyTokenStatus, getPublicEmergencyUrl } from '@/src/lib/emergency';

function token() {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}

const DEFAULT_PUBLIC_FIELDS = ['preferredName', 'bloodType', 'allergies', 'criticalConditions', 'contacts'];

function normalizePublicFields(value: unknown) {
  const fields = Array.isArray(value) ? value.map((field) => String(field)) : DEFAULT_PUBLIC_FIELDS;
  const allowed = new Set([...DEFAULT_PUBLIC_FIELDS, 'dateOfBirth', 'currentMedications', 'primaryDoctor', 'insuranceNote', 'emergencyNote']);
  return JSON.stringify(fields.filter((field) => allowed.has(field)));
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const active = await getActiveProfile(user.id);
  const access = await resolveActiveProfileAccess(user.id);
  if (!canUsePermission(access, 'dashboard.summary.view')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const profile = await prisma.emergencyProfile.findUnique({
    where: { familyProfileId: active.id },
    include: {
      contacts: { orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }] },
      accessLogs: { orderBy: { timestamp: 'desc' }, take: 10 },
    },
  });
  if (!profile) return NextResponse.json(null);
  return NextResponse.json({
    ...profile,
    token: profile.token,
    tokenStatus: getEmergencyTokenStatus(profile),
    publicUrl: getPublicEmergencyUrl(profile.token),
    contacts: profile.contacts.map((contact) => ({
      id: contact.id,
      name: contact.name,
      relationship: contact.relationship,
      phone: contact.phone,
      alternatePhone: contact.alternatePhone,
      priority: contact.priority,
      notes: contact.notes,
      active: contact.active,
    })),
    accessLogs: profile.accessLogs.map((entry) => ({
      timestamp: entry.timestamp,
      tokenRef: entry.tokenRef,
    })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const access = await resolveActiveProfileAccess(user.id);
  if (!access || access.accessType !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const active = await getActiveProfile(user.id);
  const body = await req.json();
  const created = await prisma.emergencyProfile.upsert({
    where: { familyProfileId: active.id },
    update: {
      preferredName: body.preferredName ?? null,
      dateOfBirth: body.dateOfBirth ?? null,
      bloodType: body.bloodType ?? null,
      allergies: body.allergies ?? null,
      criticalConditions: body.criticalConditions ?? null,
      currentMedications: body.currentMedications ?? null,
      primaryDoctor: body.primaryDoctor ?? null,
      insuranceNote: body.insuranceNote ?? null,
      emergencyNote: body.emergencyNote ?? null,
      publicFields: normalizePublicFields(body.publicFields),
    },
    create: {
      familyProfileId: active.id,
      preferredName: body.preferredName ?? null,
      dateOfBirth: body.dateOfBirth ?? null,
      bloodType: body.bloodType ?? null,
      allergies: body.allergies ?? null,
      criticalConditions: body.criticalConditions ?? null,
      currentMedications: body.currentMedications ?? null,
      primaryDoctor: body.primaryDoctor ?? null,
      insuranceNote: body.insuranceNote ?? null,
      emergencyNote: body.emergencyNote ?? null,
      publicFields: normalizePublicFields(body.publicFields),
      token: token(),
    },
  });
  await writeAuditLog({ userId: user.id, action: 'EMERGENCY_PROFILE_SAVED', target: `FamilyProfile:${active.id}` });
  return NextResponse.json(created);
}
