import { prisma } from './db';
import { getActiveProfile, __readCookieValue } from './auth';
import { type CareCirclePermission, hasPermission } from './permissions';

export async function resolveProfileAccess(userId: string, profileId?: string, activeProfile?: { id: string } | null) {
  const resolvedActiveProfile = activeProfile ?? await getActiveProfile(userId);
  const resolvedProfileId = profileId || resolvedActiveProfile?.id;
  if (!resolvedProfileId) return null;

  const owned = await prisma.familyProfile.findFirst({ where: { id: resolvedProfileId, userId } });
  if (owned) return { profileId: owned.id, accessType: 'owner' as const, role: 'owner', permissions: null, familyProfile: owned };

  const membership = await prisma.careCircleMember.findFirst({
    where: { userId, familyProfileId: resolvedProfileId, active: true },
    include: { familyProfile: true },
  });
  if (!membership || membership.familyProfile.userId === userId) return null;

  return {
    profileId: membership.familyProfileId,
    accessType: 'shared' as const,
    role: membership.role,
    permissions: membership.permissions,
    familyProfile: membership.familyProfile,
  };
}

export async function resolveActiveProfileAccess(userId: string, activeProfile?: { id: string } | null) {
  const resolvedActiveProfile = activeProfile ?? await getActiveProfile(userId);
  if (!resolvedActiveProfile) return null;

  const activeProfileId = await __readCookieValue('wellsync_active_profile_id');
  if (activeProfileId) {
    const access = await resolveProfileAccess(userId, activeProfileId, resolvedActiveProfile);
    if (!access) return null;
    return access;
  }

  return resolveProfileAccess(userId, resolvedActiveProfile.id, resolvedActiveProfile);
}

export function canUsePermission(access: Awaited<ReturnType<typeof resolveProfileAccess>> | null, permission: CareCirclePermission) {
  if (!access) return false;
  if (access.accessType === 'owner') return true;
  return hasPermission(access.permissions, permission);
}

export function isOwner(access: Awaited<ReturnType<typeof resolveProfileAccess>> | null) {
  return Boolean(access && access.accessType === 'owner');
}

export function denyUnlessOwnProfile(access: Awaited<ReturnType<typeof resolveProfileAccess>> | null, familyProfileId: string) {
  return Boolean(access && access.profileId === familyProfileId);
}
