import { getAppBaseUrl } from './env';

const PUBLIC_FIELD_ALLOWLIST = new Set([
  'preferredName',
  'dateOfBirth',
  'bloodType',
  'allergies',
  'criticalConditions',
  'currentMedications',
  'primaryDoctor',
  'insuranceNote',
  'emergencyNote',
  'contacts',
]);

export function parsePublicFields(value: unknown) {
  const raw = typeof value === 'string' ? (() => {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  })() : value;
  if (!Array.isArray(raw)) return [];
  return raw.map((field) => String(field)).filter((field) => PUBLIC_FIELD_ALLOWLIST.has(field));
}

export function areContactsPublic(value: unknown) {
  return parsePublicFields(value).includes('contacts');
}

export function getPublicEmergencyUrl(token: string) {
  const base = getAppBaseUrl();
  return `${base}/emergency/${token}`;
}

export function getEmergencyTokenStatus(profile: { active: boolean; expiresAt: Date | null }) {
  if (!profile.active) return 'revoked' as const;
  if (profile.expiresAt && profile.expiresAt < new Date()) return 'expired' as const;
  return 'active' as const;
}

export function getEmergencyCardStatus(profile: { active: boolean; expiresAt: Date | null } | null) {
  if (!profile) return 'setup-required' as const;
  return getEmergencyTokenStatus(profile);
}
