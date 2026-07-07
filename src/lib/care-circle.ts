import { prisma } from './db';
import { getActiveProfile } from './auth';
import { defaultPermissions, type CareCirclePermission, hasPermission } from './permissions';

export function randomToken() {
  return crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function ensureCareCircleOwnership(userId: string, familyProfileId: string) {
  return prisma.familyProfile.findFirst({ where: { id: familyProfileId, userId } });
}

export async function getMembershipForProfile(userId: string, familyProfileId: string) {
  return prisma.careCircleMember.findFirst({ where: { userId, familyProfileId, active: true } });
}

export async function hasPendingInvitation(familyProfileId: string, email: string) {
  return prisma.careCircleInvitation.findFirst({
    where: {
      familyProfileId,
      email: normalizeEmail(email),
      status: 'pending',
    },
  });
}

export function invitationIsExpired(invitation: { expiresAt: Date | null; status: string }) {
  return Boolean(invitation.expiresAt && invitation.expiresAt < new Date()) || invitation.status !== 'pending';
}

export async function getAccessibleProfiles(userId: string) {
  const owned = await prisma.familyProfile.findMany({ where: { userId } });
  const memberships = await prisma.careCircleMember.findMany({
    where: { userId, active: true, familyProfileId: { notIn: owned.map((p) => p.id) } },
    include: { familyProfile: true },
  });
  return {
    owned,
    shared: memberships.map((m) => ({ ...m.familyProfile, accessRole: m.role, relationshipLabel: m.relationshipLabel, permissions: m.permissions })),
  };
}

export function canAccess(member: { permissions: string | null }, permission: CareCirclePermission) {
  return hasPermission(member.permissions, permission);
}

export function buildPermissions(role: string, permissions?: Record<string, boolean>) {
  return JSON.stringify(permissions || defaultPermissions(role));
}

export async function currentProfileOrOwned(userId: string) {
  return getActiveProfile(userId);
}
