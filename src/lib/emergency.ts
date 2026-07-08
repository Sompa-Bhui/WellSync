import { getAppBaseUrl } from './env';

export function getPublicEmergencyUrl(token: string) {
  const base = getAppBaseUrl();
  return `${base}/emergency/${token}`;
}

export function getEmergencyTokenStatus(profile: { active: boolean; expiresAt: Date | null }) {
  if (!profile.active) return 'revoked' as const;
  if (profile.expiresAt && profile.expiresAt < new Date()) return 'expired' as const;
  return 'active' as const;
}
