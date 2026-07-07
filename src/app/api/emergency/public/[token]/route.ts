import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/db';

export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const profile = await prisma.emergencyProfile.findUnique({ where: { token }, include: { contacts: { where: { active: true }, orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }] } } });
  if (!profile || !profile.active || (profile.expiresAt && profile.expiresAt < new Date())) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.emergencyAccessLog.create({ data: { familyProfileId: profile.familyProfileId, emergencyProfileId: profile.id, tokenRef: token.slice(0, 12), requestMeta: JSON.stringify({ ua: req.headers.get('user-agent') || '' }).slice(0, 200) } });
  const enabled = new Set(JSON.parse(profile.publicFields || '[]'));
  return NextResponse.json({
    id: undefined,
    familyProfileId: undefined,
    token: undefined,
    active: undefined,
    expiresAt: profile.expiresAt ?? null,
    preferredName: enabled.has('preferredName') ? profile.preferredName : null,
    dateOfBirth: enabled.has('dateOfBirth') ? profile.dateOfBirth : null,
    bloodType: enabled.has('bloodType') ? profile.bloodType : null,
    allergies: enabled.has('allergies') ? profile.allergies : null,
    criticalConditions: enabled.has('criticalConditions') ? profile.criticalConditions : null,
    currentMedications: enabled.has('currentMedications') ? profile.currentMedications : null,
    primaryDoctor: enabled.has('primaryDoctor') ? profile.primaryDoctor : null,
    insuranceNote: enabled.has('insuranceNote') ? profile.insuranceNote : null,
    emergencyNote: enabled.has('emergencyNote') ? profile.emergencyNote : null,
    contacts: enabled.has('contacts') ? profile.contacts.map((contact) => ({
      name: contact.name,
      relationship: contact.relationship,
      phone: contact.phone,
      alternatePhone: contact.alternatePhone,
      priority: contact.priority,
    })) : [],
  });
}
