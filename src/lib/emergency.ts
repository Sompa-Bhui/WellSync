export function getPublicEmergencyUrl(token: string) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base}/emergency/${token}`;
}

export function getEmergencyTokenStatus(profile: { active: boolean; expiresAt: Date | null }) {
  if (!profile.active) return 'revoked' as const;
  if (profile.expiresAt && profile.expiresAt < new Date()) return 'expired' as const;
  return 'active' as const;
}
